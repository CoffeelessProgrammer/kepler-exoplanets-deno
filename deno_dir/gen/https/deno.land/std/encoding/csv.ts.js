import { BufReader } from "../io/bufio.ts";
import { TextProtoReader } from "../textproto/mod.ts";
import { StringReader } from "../io/readers.ts";
import { assert } from "../_util/assert.ts";
const INVALID_RUNE = ["\r", "\n", '"'];
export const ERR_BARE_QUOTE = 'bare " in non-quoted-field';
export const ERR_QUOTE = 'extraneous or missing " in quoted-field';
export const ERR_INVALID_DELIM = "Invalid Delimiter";
export const ERR_FIELD_COUNT = "wrong number of fields";
export class ParseError extends Error {
    constructor(start, line, message) {
        super(message);
        this.StartLine = start;
        this.Line = line;
    }
}
function chkOptions(opt) {
    if (!opt.comma) {
        opt.comma = ",";
    }
    if (!opt.trimLeadingSpace) {
        opt.trimLeadingSpace = false;
    }
    if (INVALID_RUNE.includes(opt.comma) ||
        (typeof opt.comment === "string" && INVALID_RUNE.includes(opt.comment)) ||
        opt.comma === opt.comment) {
        throw new Error(ERR_INVALID_DELIM);
    }
}
async function readRecord(Startline, reader, opt = { comma: ",", trimLeadingSpace: false }) {
    const tp = new TextProtoReader(reader);
    const lineIndex = Startline;
    let line = await readLine(tp);
    if (line === null)
        return null;
    if (line.length === 0) {
        return [];
    }
    if (opt.comment && line[0] === opt.comment) {
        return [];
    }
    assert(opt.comma != null);
    let quoteError = null;
    const quote = '"';
    const quoteLen = quote.length;
    const commaLen = opt.comma.length;
    let recordBuffer = "";
    const fieldIndexes = [];
    parseField: for (;;) {
        if (opt.trimLeadingSpace) {
            line = line.trimLeft();
        }
        if (line.length === 0 || !line.startsWith(quote)) {
            const i = line.indexOf(opt.comma);
            let field = line;
            if (i >= 0) {
                field = field.substring(0, i);
            }
            if (!opt.lazyQuotes) {
                const j = field.indexOf(quote);
                if (j >= 0) {
                    quoteError = ERR_BARE_QUOTE;
                    break parseField;
                }
            }
            recordBuffer += field;
            fieldIndexes.push(recordBuffer.length);
            if (i >= 0) {
                line = line.substring(i + commaLen);
                continue parseField;
            }
            break parseField;
        }
        else {
            line = line.substring(quoteLen);
            for (;;) {
                const i = line.indexOf(quote);
                if (i >= 0) {
                    recordBuffer += line.substring(0, i);
                    line = line.substring(i + quoteLen);
                    if (line.startsWith(quote)) {
                        recordBuffer += quote;
                        line = line.substring(quoteLen);
                    }
                    else if (line.startsWith(opt.comma)) {
                        line = line.substring(commaLen);
                        fieldIndexes.push(recordBuffer.length);
                        continue parseField;
                    }
                    else if (0 === line.length) {
                        fieldIndexes.push(recordBuffer.length);
                        break parseField;
                    }
                    else if (opt.lazyQuotes) {
                        recordBuffer += quote;
                    }
                    else {
                        quoteError = ERR_QUOTE;
                        break parseField;
                    }
                }
                else if (line.length > 0 || !(await isEOF(tp))) {
                    recordBuffer += line;
                    const r = await readLine(tp);
                    if (r === null) {
                        if (!opt.lazyQuotes) {
                            quoteError = ERR_QUOTE;
                            break parseField;
                        }
                        fieldIndexes.push(recordBuffer.length);
                        break parseField;
                    }
                    recordBuffer += "\n";
                    line = r;
                }
                else {
                    if (!opt.lazyQuotes) {
                        quoteError = ERR_QUOTE;
                        break parseField;
                    }
                    fieldIndexes.push(recordBuffer.length);
                    break parseField;
                }
            }
        }
    }
    if (quoteError) {
        throw new ParseError(Startline, lineIndex, quoteError);
    }
    const result = [];
    let preIdx = 0;
    for (const i of fieldIndexes) {
        result.push(recordBuffer.slice(preIdx, i));
        preIdx = i;
    }
    return result;
}
async function isEOF(tp) {
    return (await tp.r.peek(0)) === null;
}
async function readLine(tp) {
    let line;
    const r = await tp.readLine();
    if (r === null)
        return null;
    line = r;
    if ((await isEOF(tp)) && line.length > 0 && line[line.length - 1] === "\r") {
        line = line.substring(0, line.length - 1);
    }
    if (line.length >= 2 &&
        line[line.length - 2] === "\r" &&
        line[line.length - 1] === "\n") {
        line = line.substring(0, line.length - 2);
        line = line + "\n";
    }
    return line;
}
export async function readMatrix(reader, opt = {
    comma: ",",
    trimLeadingSpace: false,
    lazyQuotes: false,
}) {
    const result = [];
    let _nbFields;
    let lineResult;
    let first = true;
    let lineIndex = 0;
    chkOptions(opt);
    for (;;) {
        const r = await readRecord(lineIndex, reader, opt);
        if (r === null)
            break;
        lineResult = r;
        lineIndex++;
        if (first) {
            first = false;
            if (opt.fieldsPerRecord !== undefined) {
                if (opt.fieldsPerRecord === 0) {
                    _nbFields = lineResult.length;
                }
                else {
                    _nbFields = opt.fieldsPerRecord;
                }
            }
        }
        if (lineResult.length > 0) {
            if (_nbFields && _nbFields !== lineResult.length) {
                throw new ParseError(lineIndex, lineIndex, ERR_FIELD_COUNT);
            }
            result.push(lineResult);
        }
    }
    return result;
}
export async function parse(input, opt = {
    header: false,
}) {
    let r;
    if (input instanceof BufReader) {
        r = await readMatrix(input, opt);
    }
    else {
        r = await readMatrix(new BufReader(new StringReader(input)), opt);
    }
    if (opt.header) {
        let headers = [];
        let i = 0;
        if (Array.isArray(opt.header)) {
            if (typeof opt.header[0] !== "string") {
                headers = opt.header;
            }
            else {
                const h = opt.header;
                headers = h.map((e) => {
                    return {
                        name: e,
                    };
                });
            }
        }
        else {
            const head = r.shift();
            assert(head != null);
            headers = head.map((e) => {
                return {
                    name: e,
                };
            });
            i++;
        }
        return r.map((e) => {
            if (e.length !== headers.length) {
                throw `Error number of fields line:${i}`;
            }
            i++;
            const out = {};
            for (let j = 0; j < e.length; j++) {
                const h = headers[j];
                if (h.parse) {
                    out[h.name] = h.parse(e[j]);
                }
                else {
                    out[h.name] = e[j];
                }
            }
            if (opt.parse) {
                return opt.parse(out);
            }
            return out;
        });
    }
    if (opt.parse) {
        return r.map((e) => {
            assert(opt.parse, "opt.parse must be set");
            return opt.parse(e);
        });
    }
    return r;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3N2LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY3N2LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQU1BLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUMzQyxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFDdEQsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBQ2hELE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUU1QyxNQUFNLFlBQVksR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFFdkMsTUFBTSxDQUFDLE1BQU0sY0FBYyxHQUFHLDRCQUE0QixDQUFDO0FBQzNELE1BQU0sQ0FBQyxNQUFNLFNBQVMsR0FBRyx5Q0FBeUMsQ0FBQztBQUNuRSxNQUFNLENBQUMsTUFBTSxpQkFBaUIsR0FBRyxtQkFBbUIsQ0FBQztBQUNyRCxNQUFNLENBQUMsTUFBTSxlQUFlLEdBQUcsd0JBQXdCLENBQUM7QUFFeEQsTUFBTSxPQUFPLFVBQVcsU0FBUSxLQUFLO0lBR25DLFlBQVksS0FBYSxFQUFFLElBQVksRUFBRSxPQUFlO1FBQ3RELEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNmLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0lBQ25CLENBQUM7Q0FDRjtBQW9CRCxTQUFTLFVBQVUsQ0FBQyxHQUFnQjtJQUNsQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRTtRQUNkLEdBQUcsQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDO0tBQ2pCO0lBQ0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRTtRQUN6QixHQUFHLENBQUMsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDO0tBQzlCO0lBQ0QsSUFDRSxZQUFZLENBQUMsUUFBUSxDQUFDLEdBQUcs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