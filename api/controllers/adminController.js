import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import Category from '../models/Category.js';
import Deal from '../models/Deal.js';
import User from '../models/User.js';

// Dashboard Stats
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Today's stats
    const todayOrders = await Order.countDocuments({ 
      createdAt: { $gte: today } 
    });

    const todayRevenue = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: today }, 
          status: { $ne: 'cancelled' } 
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$totalAmount' } 
        } 
      }
    ]);

    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const totalUsers = await User.countDocuments({ role: 'customer' });

    // Yesterday's stats for comparison
    const yesterdayOrders = await Order.countDocuments({ 
      createdAt: { $gte: yesterday, $lt: today } 
    });

    const yesterdayRevenue = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: yesterday, $lt: today }, 
          status: { $ne: 'cancelled' } 
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$totalAmount' } 
        } 
      }
    ]);

    // Recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email')
      .populate('items.menuItem', 'name');

    // Popular items
    const popularItems = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItem',
          count: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'menuitems',
          localField: '_id',
          foreignField: '_id',
          as: 'itemDetails'
        }
      },
      { $unwind: '$itemDetails' }
    ]);

    const stats = {
      todayOrders,
      todayRevenue: todayRevenue[0]?.total || 0,
      pendingOrders,
      totalUsers,
      orderGrowth: yesterdayOrders > 0 
        ? ((todayOrders - yesterdayOrders) / yesterdayOrders * 100).toFixed(2)
        : 0,
      revenueGrowth: yesterdayRevenue[0]?.total > 0
        ? ((todayRevenue[0]?.total - yesterdayRevenue[0]?.total) / yesterdayRevenue[0]?.total * 100).toFixed(2)
        : 0
    };

    res.json({ stats, recentOrders, popularItems });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Menu Management
export const addMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, isTopSelling, isAvailable } = req.body;
    // console.log(name, description, price, category, isTopSelling, isAvailable)
    console.log('sss')
    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }

    const menuItem = new MenuItem({
      name,
      description,
      price: parseFloat(price),
      image: req.file.path,
      category,
      isTopSelling: isTopSelling === 'true',
      isAvailable: isAvailable !== 'false'
    });

    await menuItem.save();
    
    const populatedItem = await MenuItem.findById(menuItem._id)
      .populate('category', 'name');

    res.status(201).json({ 
      message: 'Menu item added successfully', 
      menuItem: populatedItem 
    });
  } catch (error) {
    console.error('Add menu item error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (req.file) {
      updates.image = req.file.path;
    }

    // Convert string booleans to actual booleans
    if (updates.isTopSelling !== undefined) {
      updates.isTopSelling = updates.isTopSelling === 'true';
    }
    if (updates.isAvailable !== undefined) {
      updates.isAvailable = updates.isAvailable === 'true';
    }
    if (updates.price !== undefined) {
      updates.price = parseFloat(updates.price);
    }

    const menuItem = await MenuItem.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('category', 'name');

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json({ 
      message: 'Menu item updated successfully', 
      menuItem 
    });
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    const menuItem = await MenuItem.findByIdAndDelete(id);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json({ 
      message: 'Menu item deleted successfully' 
    });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAllMenuItems = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const skip = (page - 1) * limit;
    
    let filter = {};
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const menuItems = await MenuItem.find(filter)
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MenuItem.countDocuments(filter);

    res.json({
      menuItems,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get all menu items error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Categories Management
export const addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }
    console.log('name')

    const category = new Category({
      name,
      image: req.file.path,
      isActive: true
    });
    console.log('name1')
    await category.save();
    res.status(201).json({ 
      message: 'Category added successfully', 
      category 
    });
  } catch (error) {
    console.error('Add category error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (req.file) {
      updates.image = req.file.path;
    }

    const category = await Category.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ 
      message: 'Category updated successfully', 
      category 
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Get all categories error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Orders Management
export const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;
    const skip = (page - 1) * limit;
    
    let filter = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    
    const orders = await Order.find(filter)
      .populate('user', 'name email phone')
      .sort({ [sort]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      orders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    )
    .populate('user', 'name email phone')
    .populate('items.menuItem', 'name');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Emit order status update if user is connected via socket
    const io = req.app.get('io');
    io.to(`user-${order.user._id}`).emit('orderStatusUpdate', order);

    res.json({ 
      message: 'Order status updated successfully', 
      order 
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findById(id)
      .populate('user', 'name email phone address')
      .populate('items.menuItem', 'name image price');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reports
export const getSalesReport = async (req, res) => {
  try {
    const { period = 'daily', startDate, endDate } = req.query;
    
    let match = { status: { $ne: 'cancelled' } };
    
    if (startDate && endDate) {
      match.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      const now = new Date();
      let startDate = new Date();
      
      if (period === 'daily') {
        startDate.setHours(0, 0, 0, 0);
      } else if (period === 'weekly') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === 'monthly') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (period === 'yearly') {
        startDate.setFullYear(startDate.getFullYear() - 1);
      }
      
      match.createdAt = { $gte: startDate };
    }

    const report = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Calculate summary
    const summary = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    res.json({
      report,
      summary: summary[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        avgOrderValue: 0
      }
    });
  } catch (error) {
    console.error('Get sales report error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// User Management
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;
    
    let filter = { role: 'customer' };
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};