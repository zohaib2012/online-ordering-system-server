import MenuItem from '../models/MenuItem.js';
import Category from '../models/Category.js';

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getMenuItems = async (req, res) => {
  try {
    const { category, search, sort = 'createdAt', order = 'desc' } = req.query;
    let filter = { isAvailable: true };

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    
    const menuItems = await MenuItem.find(filter)
      .populate('category', 'name image')
      .sort({ [sort]: sortOrder });

    res.json(menuItems);
  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getTopSelling = async (req, res) => {
  try {
    const topSelling = await MenuItem.find({ 
      isTopSelling: true, 
      isAvailable: true 
    })
    .populate('category', 'name')
    .limit(10)
    .sort({ createdAt: -1 });

    res.json(topSelling);
  } catch (error) {
    console.error('Get top selling error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id)
      .populate('category', 'name image');

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json(menuItem);
  } catch (error) {
    console.error('Get menu item error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getMenuByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const menuItems = await MenuItem.find({ 
      category: categoryId,
      isAvailable: true 
    }).populate('category', 'name');

    res.json({
      category,
      items: menuItems
    });
  } catch (error) {
    console.error('Get menu by category error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};