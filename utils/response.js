// 成功响应
const successResponse = (data = null, message = '成功') => {
  return {
    code: 0,
    message,
    data
  };
};

// 错误响应
const errorResponse = (message = '错误', code = -1, data = null) => {
  return {
    code,
    message,
    data
  };
};

// 分页响应
const paginationResponse = (items, total, page, pageSize) => {
  return {
    code: 0,
    message: '成功',
    data: {
      items,
      pagination: {
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(total / pageSize)
      }
    }
  };
};

module.exports = {
  successResponse,
  errorResponse,
  paginationResponse
};
