import marked from "marked";

var PlainRenderer = (() => {
    var renderer = new marked.Renderer();
    renderer.blockquote = (quote) => `"${quote}"`
    renderer.br = () => "\n";
    renderer.code = (code, _, __) => code + "\n";
    renderer.codespan = (code) => code;
    renderer.em = (text) => text;
    renderer.heading = (text) => text + "\n";
    renderer.hr = () => "------------\n";
    renderer.image = (_, __, text) => text + "\n";
    renderer.link = (href, _, text) => `${text} (${href})`;
    renderer.list = (body, _) => body;
    renderer.listitem = (text) => "• " + text;
    renderer.paragraph = (text) => text;
    renderer.strong = (text) => text;
    return renderer;
})();

var Renderer = (() => {
    var renderer = new marked.Renderer();
    renderer.link = function(href, title, text) {
        if (title == "btn") return `<a class="btn" href="${href}">${text}</a>`
        return new marked.Renderer().link.apply(this, arguments);
    }
    renderer.code = function(code, lang, isEscaped) {
        if (lang == "lead") return "<p class=\"lead\">" + code + "</p>";
        if (lang == "muted-lead") return "<p class=\"lead text-muted\">" + code + "</p>";
        if (lang == "small") return "<small>" + code + "</small>";
        if (lang == "small-muted") return "<small class=\"text-muted\">" + code + "</small>";
        if (lang == "term") return "<span class=\"term\">" + code + "</span>";
        return new marked.Renderer().code.apply(this, arguments);
    }
    return renderer;
})();

export default function Markdown(source: string, plain: boolean = false): Promise<string> {
    return new Promise((resolve, reject) => {
        marked(source, { renderer: plain ? PlainRenderer : Renderer }, (err, result) => {
            if (!result) return reject(err);
            resolve(result);
        });
    });
}