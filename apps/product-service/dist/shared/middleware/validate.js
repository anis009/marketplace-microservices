"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const validate = (schema, source = 'body') => {
    return ((req, res, next) => {
        const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
        const parsed = schema.safeParse(data);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }
        if (source === 'body') {
            req.body = parsed.data;
        }
        else if (source === 'query') {
            req.query = parsed.data;
        }
        else {
            req.params = parsed.data;
        }
        next();
    });
};
exports.validate = validate;
//# sourceMappingURL=validate.js.map