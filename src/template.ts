import { read } from "./helpers";

export function renderTemplate(template: string, data: object): string {
    return template.replace(/{{([a-z]+)}}/g, (match, key) => {
        return data[key];
    });
}

export async function loadTemplate(path: string, data: object): Promise<string> {
    let contents = await read(path);

    return renderTemplate(contents, data);
}