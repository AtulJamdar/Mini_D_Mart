import Category from '../models/Category.js';
import Product from '../models/Product.js';
import AuditLoggerService from '../services/auditLogger.service.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

/**
 * Get all categories
 * GET /api/categories
 */
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    return sendSuccess(res, {
      statusCode: 200,
      data: categories,
      message: 'Categories retrieved successfully',
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      message: 'Failed to retrieve categories',
      error: error.message,
    });
  }
};

/**
 * Create category (Admin)
 * POST /api/categories
 */
export const createCategory = async (req, res) => {
  try {
    const { name, description, imageUrl } = req.body;
    if (!name || !name.trim()) {
      return sendError(res, { statusCode: 400, message: 'Category name is required.' });
    }

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return sendError(res, { statusCode: 409, message: 'A category with this name already exists.' });
    }

    const category = await Category.create({
      name: name.trim(),
      description: description?.trim(),
      imageUrl: imageUrl?.trim(),
      isActive: true,
    });

    await AuditLoggerService.logEvent({
      userId: req.user?._id,
      action: 'ADMIN_CREATE_CATEGORY',
      resource: 'CATEGORY',
      resourceId: category._id,
      metadata: { name: category.name },
    });

    return sendSuccess(res, {
      statusCode: 201,
      data: category,
      message: `Category "${category.name}" created successfully.`,
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 400,
      message: error.message || 'Failed to create category',
    });
  }
};

/**
 * Update category (Admin)
 * PATCH /api/categories/:id
 */
export const updateCategory = async (req, res) => {
  try {
    const { name, description, imageUrl, isActive } = req.body;
    const updates = {};

    if (name) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (imageUrl !== undefined) updates.imageUrl = imageUrl.trim();
    if (typeof isActive === 'boolean') updates.isActive = isActive;

    const category = await Category.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!category) {
      return sendError(res, { statusCode: 404, message: 'Category not found' });
    }

    await AuditLoggerService.logEvent({
      userId: req.user?._id,
      action: 'ADMIN_UPDATE_CATEGORY',
      resource: 'CATEGORY',
      resourceId: category._id,
      metadata: { updates, name: category.name },
    });

    return sendSuccess(res, {
      statusCode: 200,
      data: category,
      message: 'Category updated successfully.',
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 400,
      message: error.message || 'Failed to update category',
    });
  }
};

/**
 * Delete category (Admin)
 * DELETE /api/categories/:id
 */
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return sendError(res, { statusCode: 404, message: 'Category not found' });
    }

    // Check if products exist in this category
    const associatedProducts = await Product.countDocuments({ categoryId: req.params.id });
    if (associatedProducts > 0) {
      return sendError(res, {
        statusCode: 400,
        message: `Cannot delete category "${category.name}" because ${associatedProducts} product(s) are currently assigned to it. Please reassign products first or deactivate the category instead.`,
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    await AuditLoggerService.logEvent({
      userId: req.user?._id,
      action: 'ADMIN_DELETE_CATEGORY',
      resource: 'CATEGORY',
      resourceId: req.params.id,
      metadata: { name: category.name },
    });

    return sendSuccess(res, {
      statusCode: 200,
      message: `Category "${category.name}" deleted successfully.`,
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 400,
      message: error.message || 'Failed to delete category',
    });
  }
};
