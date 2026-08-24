import { sendSuccess, sendError } from '../utils/responseHelper.js';

/**
 * Add a delivery address
 * POST /api/auth/addresses
 */
export const addAddress = async (req, res) => {
  const {
    label,
    addressLine1,
    line1,
    addressLine2,
    line2,
    city,
    state,
    pincode,
    landmark,
    phone,
    isDefault,
  } = req.body;

  const street1 = (addressLine1 || line1 || '').trim();
  const street2 = (addressLine2 || line2 || '').trim();
  const cleanCity = (city || '').trim();
  const cleanPincode = (pincode || '').toString().trim();
  const cleanPhone = phone ? phone.toString().replace(/\D/g, '').slice(-10) : (req.user?.phone || '');

  if (!street1 || !cleanCity || !cleanPincode) {
    return sendError(res, {
      statusCode: 400,
      message: 'Address line 1, city, and PIN code are required.',
    });
  }

  if (!/^\d{6}$/.test(cleanPincode)) {
    return sendError(res, {
      statusCode: 400,
      message: 'PIN code must be a valid 6-digit number.',
    });
  }

  if (phone && cleanPhone.length !== 10) {
    return sendError(res, {
      statusCode: 400,
      message: 'Phone number must be a valid 10-digit number.',
    });
  }

  try {
    const user = req.user;
    const makeDefault = Boolean(isDefault || user.addresses.length === 0);

    if (makeDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    const newAddr = {
      label: label ? label.trim() : 'Home',
      addressLine1: street1,
      addressLine2: street2,
      city: cleanCity,
      state: state ? state.trim() : 'Maharashtra',
      pincode: cleanPincode,
      landmark: landmark ? landmark.trim() : '',
      phone: cleanPhone,
      isDefault: makeDefault,
    };

    user.addresses.push(newAddr);
    await user.save();

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Address added successfully.',
      data: {
        addresses: user.addresses,
      },
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      message: 'Failed to add address.',
      error: error.message,
    });
  }
};

/**
 * Delete a delivery address
 * DELETE /api/auth/addresses/:id
 */
export const deleteAddress = async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  try {
    const targetAddr = user.addresses.find((addr) => addr._id.toString() === id);

    if (!targetAddr) {
      return sendError(res, {
        statusCode: 404,
        message: 'Address not found.',
      });
    }

    // Check: Cannot delete default address without promoting another address first if multiple addresses exist
    if (targetAddr.isDefault && user.addresses.length > 1) {
      return sendError(res, {
        statusCode: 400,
        message: 'Cannot delete your default address while other addresses exist. Please set another address as default first.',
      });
    }

    user.addresses = user.addresses.filter((addr) => addr._id.toString() !== id);
    await user.save();

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Address deleted successfully.',
      data: {
        addresses: user.addresses,
      },
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      message: 'Failed to delete address.',
      error: error.message,
    });
  }
};
