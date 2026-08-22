import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

/**
 * Cart Service
 * Manages cart mutations and enforces live inventory stock constraints.
 */
class CartService {
  /**
   * Helper: calculate live totals and format cart items with current stock info
   */
  static async formatAndCalculateCart(cart) {
    if (!cart || !cart.items || cart.items.length === 0) {
      return {
        _id: cart?._id,
        userId: cart?.userId,
        items: [],
        itemCount: 0,
        subtotal: 0,
        tax: 0,
        total: 0,
      };
    }

    // Populate product details
    const productIds = cart.items.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    let subtotal = 0;
    let itemCount = 0;
    const formattedItems = [];
    const validItemsForSave = [];

    for (const item of cart.items) {
      const product = productMap.get(item.productId.toString());

      if (!product) {
        // Product no longer exists in database; skip it
        continue;
      }

      const itemPrice = product.price;
      const itemQty = Math.max(1, item.qty);
      const itemSubtotal = itemPrice * itemQty;
      const isAvailable = product.stock >= itemQty;

      subtotal += itemSubtotal;
      itemCount += itemQty;

      validItemsForSave.push({
        _id: item._id,
        productId: product._id,
        qty: itemQty,
      });

      formattedItems.push({
        _id: item._id,
        productId: product._id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        images: product.images,
        storeId: product.storeId,
        availableStock: product.stock,
        qty: itemQty,
        itemSubtotal,
        isAvailable,
      });
    }

    // If any orphaned items were purged, persist the cleaned list
    if (validItemsForSave.length !== cart.items.length) {
      cart.items = validItemsForSave;
      await cart.save();
    }

    const tax = Math.round(subtotal * 0.05 * 100) / 100; // 5% GST
    const total = Math.round((subtotal + tax) * 100) / 100;

    return {
      _id: cart._id,
      userId: cart.userId,
      items: formattedItems,
      itemCount,
      subtotal: Math.round(subtotal * 100) / 100,
      tax,
      total,
    };
  }

  /**
   * Get user's cart with live recalculated totals
   */
  static async getCart(userId) {
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }
    return this.formatAndCalculateCart(cart);
  }

  /**
   * Add item to cart with stock validation
   */
  static async addItem(userId, { productId, qty = 1 }) {
    const requestedQty = Number(qty);
    if (!requestedQty || requestedQty < 1) {
      throw new Error('Quantity must be at least 1');
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId.toString()
    );

    const currentQtyInCart = existingItemIndex > -1 ? cart.items[existingItemIndex].qty : 0;
    const targetQty = currentQtyInCart + requestedQty;

    // Strict stock validation
    if (targetQty > product.stock) {
      throw new Error(
        `Cannot add ${requestedQty} item(s). Available stock is ${product.stock} (you already have ${currentQtyInCart} in cart).`
      );
    }

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].qty = targetQty;
    } else {
      cart.items.push({ productId, qty: requestedQty });
    }

    await cart.save();
    return this.formatAndCalculateCart(cart);
  }

  /**
   * Update item quantity in cart with stock validation
   */
  static async updateItemQty(userId, { productId, qty }) {
    const targetQty = Number(qty);

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId.toString()
    );

    if (existingItemIndex === -1) {
      throw new Error('Item not found in cart');
    }

    // If quantity is set to 0 or less, remove the item
    if (targetQty <= 0) {
      cart.items.splice(existingItemIndex, 1);
      await cart.save();
      return this.formatAndCalculateCart(cart);
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Strict stock validation
    if (targetQty > product.stock) {
      throw new Error(
        `Requested quantity (${targetQty}) exceeds available stock (${product.stock}) for "${product.name}".`
      );
    }

    cart.items[existingItemIndex].qty = targetQty;
    await cart.save();
    return this.formatAndCalculateCart(cart);
  }

  /**
   * Remove item from cart
   */
  static async removeItem(userId, productId) {
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      return this.getCart(userId);
    }

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId.toString()
    );

    await cart.save();
    return this.formatAndCalculateCart(cart);
  }

  /**
   * Clear all items from user cart
   */
  static async clearCart(userId) {
    let cart = await Cart.findOne({ userId });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    return this.formatAndCalculateCart(cart || { userId, items: [] });
  }
}

export default CartService;
