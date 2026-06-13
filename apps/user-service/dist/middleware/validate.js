"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const response_1 = require("../utils/response");
const validate = (schema, source = 'body') => {
    return ((req, res, next) => {
        const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
        const parsed = schema.safeParse(data);
        if (!parsed.success) {
            (0, response_1.sendError)(res, {
                statusCode: 400,
                message: 'Validation failed',
                details: parsed.error.flatten().fieldErrors,
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