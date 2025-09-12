const { getPaginationOffset, formatPaginationResponse, errorResponse } = require('../utils/helpers');

// Middleware xử lý pagination
const pagination = (defaultLimit = 10, maxLimit = 100) => {
    return (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = Math.min(parseInt(req.query.limit) || defaultLimit, maxLimit);

            if (page < 1) {
                return errorResponse(res, 'Page must be greater than 0', 400);
            }

            if (limit < 1) {
                return errorResponse(res, 'Limit must be greater than 0', 400);
            }

            const { offset } = getPaginationOffset(page, limit);

            // Attach pagination info to request object
            req.pagination = {
                page,
                limit,
                offset
            };

            // Helper function to format paginated response
            req.paginatedResponse = (data, total) => {
                return formatPaginationResponse(data, total, page, limit);
            };

            next();
        } catch (error) {
            return errorResponse(res, 'Invalid pagination parameters', 400);
        }
    };
};

// Middleware cho search với pagination
const searchPagination = (defaultLimit = 10, maxLimit = 100) => {
    return (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = Math.min(parseInt(req.query.limit) || defaultLimit, maxLimit);
            const search = req.query.q || '';

            if (page < 1) {
                return errorResponse(res, 'Page must be greater than 0', 400);
            }

            if (limit < 1) {
                return errorResponse(res, 'Limit must be greater than 0', 400);
            }

            const { offset } = getPaginationOffset(page, limit);

            req.pagination = {
                page,
                limit,
                offset,
                search: search.trim()
            };

            req.paginatedResponse = (data, total) => {
                const result = formatPaginationResponse(data, total, page, limit);
                if (search) {
                    result.search = search;
                }
                return result;
            };

            next();
        } catch (error) {
            return errorResponse(res, 'Invalid pagination parameters', 400);
        }
    };
};

// Middleware cho sorting với pagination
const sortablePagination = (allowedSortFields = [], defaultSort = 'id', defaultOrder = 'desc') => {
    return (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = Math.min(parseInt(req.query.limit) || 10, 100);
            const sortBy = req.query.sort || defaultSort;
            const order = (req.query.order || defaultOrder).toLowerCase();

            if (page < 1) {
                return errorResponse(res, 'Page must be greater than 0', 400);
            }

            if (limit < 1) {
                return errorResponse(res, 'Limit must be greater than 0', 400);
            }

            if (allowedSortFields.length > 0 && !allowedSortFields.includes(sortBy)) {
                return errorResponse(res, `Invalid sort field. Allowed fields: ${allowedSortFields.join(', ')}`, 400);
            }

            if (!['asc', 'desc'].includes(order)) {
                return errorResponse(res, 'Order must be either asc or desc', 400);
            }

            const { offset } = getPaginationOffset(page, limit);

            req.pagination = {
                page,
                limit,
                offset,
                sortBy,
                order
            };

            req.paginatedResponse = (data, total) => {
                const result = formatPaginationResponse(data, total, page, limit);
                result.sorting = {
                    sortBy,
                    order
                };
                return result;
            };

            next();
        } catch (error) {
            return errorResponse(res, 'Invalid pagination parameters', 400);
        }
    };
};

// Middleware cho filtering với pagination
const filterablePagination = (allowedFilters = {}) => {
    return (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = Math.min(parseInt(req.query.limit) || 10, 100);

            if (page < 1) {
                return errorResponse(res, 'Page must be greater than 0', 400);
            }

            if (limit < 1) {
                return errorResponse(res, 'Limit must be greater than 0', 400);
            }

            const { offset } = getPaginationOffset(page, limit);
            const filters = {};

            // Process allowed filters
            Object.keys(allowedFilters).forEach(key => {
                if (req.query[key] !== undefined) {
                    const filterConfig = allowedFilters[key];
                    let value = req.query[key];

                    // Type conversion based on config
                    if (filterConfig.type === 'number') {
                        value = parseInt(value);
                        if (isNaN(value)) return;
                    } else if (filterConfig.type === 'boolean') {
                        value = value === 'true';
                    } else if (filterConfig.type === 'array') {
                        value = Array.isArray(value) ? value : [value];
                    }

                    // Validate against allowed values
                    if (filterConfig.values && !filterConfig.values.includes(value)) {
                        return;
                    }

                    filters[key] = value;
                }
            });

            req.pagination = {
                page,
                limit,
                offset,
                filters
            };

            req.paginatedResponse = (data, total) => {
                const result = formatPaginationResponse(data, total, page, limit);
                if (Object.keys(filters).length > 0) {
                    result.filters = filters;
                }
                return result;
            };

            next();
        } catch (error) {
            return errorResponse(res, 'Invalid pagination parameters', 400);
        }
    };
};

module.exports = {
    pagination,
    searchPagination,
    sortablePagination,
    filterablePagination
};