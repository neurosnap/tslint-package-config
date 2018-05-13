import * as ts from 'typescript';
import * as Lint from 'tslint';
import { findImports, ImportKind } from 'tsutils';

export class Rule extends Lint.Rules.AbstractRule {
  public static metadata: Lint.IRuleMetadata = {
    type: "functionality",
    ruleName: "module-boundary",
    description: "Disallows importing any submodule.",
    optionsDescription: Lint.Utils.dedent`
      Submodules of some packages are treated as private APIs and the import
      paths may change without deprecation periods. It's best to stick with
      top-level package exports.

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
    return this.applyWithFunction(sourceFile, walk, opts);
  }
}

function createImportRe(namespace: string) {
  return new RegExp(`${namespace}\/(.+)\/`);
}

function getNamespace(opts: Lint.IOptions) {
  return opts.ruleArguments[0];
}

function walk(ctx: Lint.WalkContext<Lint.IOptions>) {
  for (const name of findImports(ctx.sourceFile, ImportKind.All)) {
    const namespace = getNamespace(ctx.options);
    if (!namespace) {
      return;
    }

    const importName = name.text;
    const importRe = createImportRe(namespace);
    const regResults = importRe.exec(importName);

    if (regResults) {
      if (/types$/.test(importName)) {
        return;
      }

      ctx.addFailure(
        name.getStart(ctx.sourceFile) + 1,
        name.end - 1,
        `${Rule.FAILURE_STRING}, must import package like: ${namespace}/${regResults[1]}`,
      );
    }
  }
}
