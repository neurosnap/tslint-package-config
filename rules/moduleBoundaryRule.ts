import * as ts from 'typescript';
import * as Lint from 'tslint';

export class Rule extends Lint.Rules.AbstractRule {
  public static metadata: Lint.IRuleMetadata = {
    type: "functionality",
    ruleName: "module-boundary",
    description: "Create strict module boundaries for packages",
    optionsDescription: Lint.Utils.dedent`
      Must provide namespace for packages.
    `,
    options: {
      options: {
        type: "string",
      },
    },
    optionExamples: [[true, "@battlestar"]],
    hasFix: false,
    typescriptOnly: true,
  };
  public static FAILURE_STRING = "cannot reach into package";

  public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
    const opts = this.getOptions();
    const rule = new ModuleBoundaryWalker(sourceFile, opts)
    return this.applyWithWalker(rule);
  }
}

function createImportRe(namespace: string) {
  return new RegExp(`${namespace}\/(.+)\/`);
}

class ModuleBoundaryWalker extends Lint.RuleWalker {
  public getNamespace() {
    const opts = this.getOptions();
    const namespace = opts[0];
    return namespace;
  }

  public visitVariableDeclaration(node: ts.VariableDeclaration) {
    const namespace = this.getNamespace();
    if (!namespace) {
      return;
    }
    const importName = node.initializer.getText();

    if (importName.indexOf('require') !== 0) {
      return;
    }

    const importRe = createImportRe(namespace);
    const regResults = importRe.exec(importName);

    if (regResults) {
      if (/types'\)$/.test(importName)) {
        return;
      }

      this.addFailureAtNode(
        node,
        `${Rule.FAILURE_STRING}, must import package like: ${namespace}/${regResults[1]}`,
      )
    }
  }

  public visitImportDeclaration(node: ts.ImportDeclaration) {
    const namespace = this.getNamespace();
    if (!namespace) {
      return;
    }
    const importName = node.moduleSpecifier.getText();
    const importRe = createImportRe(namespace);
    const regResults = importRe.exec(importName);

    if (regResults) {
      if (/types'$/.test(importName)) {
        return;
      }

      this.addFailureAtNode(
        node,
        `${Rule.FAILURE_STRING}, must import package like: ${namespace}/${regResults[1]}`,
      );
    }
  }
}
