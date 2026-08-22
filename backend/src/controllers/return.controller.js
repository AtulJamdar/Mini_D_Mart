import ReturnEligibilityService from '../services/returnEligibilityService.js';
import ReturnService from '../services/returnService.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

/**
 * Check return eligibility for an order item
 * GET /api/returns/eligibility/:orderId/:itemId
 */
export const checkEligibility = async (req, res) => {
  try {
    const isCustomer = req.user.role === 'customer';
    const result = await ReturnEligibilityService.checkItemEligibility(
      req.params.orderId,
      req.params.itemId,
      isCustomer ? req.user._id : null
    );

    return sendSuccess(res, {
      statusCode: 200,
      data: result,
      message: 'Eligibility status checked',
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      message: 'Failed to check return eligibility',
      error: error.message,
    });
  }
};

/**
 * Create a return or exchange request
 * POST /api/returns
 */
export const createReturn = async (req, res) => {
  try {
    const { orderId, itemId, type, reason, evidenceUrls } = req.body;

    const request = await ReturnEligibilityService.createReturnRequest(req.user._id, {
      orderId,
      itemId,
      type,
      reason,
      evidenceUrls,
    });

    return sendSuccess(res, {
      statusCode: 201,
      data: request,
      message: 'Return/Exchange request submitted successfully!',
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 400,
      message: error.message || 'Failed to submit return request',
    });
  }
};

/**
 * Get return requests (own for customer, store queue for manager)
 * GET /api/returns
 */
export const getReturns = async (req, res) => {
  try {
    const { status, storeId } = req.query;

    const requests = await ReturnService.getReturns({
      userId: req.user._id,
      role: req.user.role,
      status,
      storeId,
    });

    return sendSuccess(res, {
      statusCode: 200,
      data: requests,
      message: 'Return requests retrieved successfully',
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      message: 'Failed to retrieve return requests',
      error: error.message,
    });
  }
};

/**
 * Approve a return request (Store Manager / Admin)
 * PATCH /api/returns/:id/approve
 */
export const approveReturn = async (req, res) => {
  try {
    const result = await ReturnService.approveReturnRequest(req.params.id, req.user._id);

    return sendSuccess(res, {
      statusCode: 200,
      data: result,
      message: 'Return request approved successfully.',
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 400,
      message: error.message || 'Failed to approve return request',
    });
  }
};

/**
 * Reject a return request (Store Manager / Admin)
 * PATCH /api/returns/:id/reject
 */
export const rejectReturn = async (req, res) => {
  try {
    const { reason } = req.body;
    const request = await ReturnService.rejectReturnRequest(
      req.params.id,
      req.user._id,
      reason || 'Rejected by store manager'
    );

    return sendSuccess(res, {
      statusCode: 200,
      data: request,
      message: 'Return request rejected.',
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 400,
      message: error.message || 'Failed to reject return request',
    });
  }
};
