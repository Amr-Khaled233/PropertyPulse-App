// Reusable prompt template helper (variable interpolation, system+user composition).

export type TemplateVariables = Record<string, string | number | boolean>;

export interface PromptTemplateOptions {
  /** System instruction paired with the rendered user prompt. */
  system?: string;
}

/** A string with `{{variable}}` placeholders that can be filled at call time. */
export class PromptTemplate {
  constructor(
    private readonly template: string,
    private readonly options: PromptTemplateOptions = {},
  ) {}

  /** Replace every `{{name}}` placeholder; throws on a missing variable. */
  render(vars: TemplateVariables = {}): string {
    return this.template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) => {
      if (!(key in vars)) {
        throw new Error(`Missing prompt variable: ${key}`);
      }
      return String(vars[key]);
    });
  }

  /** Render the user prompt and pair it with the (optional) system instruction. */
  compose(vars: TemplateVariables = {}): { system?: string; user: string } {
    return { system: this.options.system, user: this.render(vars) };
  }
}

/** One-shot convenience: fill a template string without constructing a class. */
export function fillTemplate(template: string, vars: TemplateVariables = {}): string {
  return new PromptTemplate(template).render(vars);
}
