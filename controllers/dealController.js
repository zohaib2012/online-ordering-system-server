import Deal from '../models/Deal.js';

export const getActiveDeals = async (req, res) => {
  try {
    const now = new Date();
    const deals = await Deal.find({ 
      isActive: true,
      validTill: { $gte: now }
    }).sort({ createdAt: -1 });

    res.json(deals);
  } catch (error) {
    console.error('Get active deals error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createDeal = async (req, res) => {
  try {
    const { title, description, originalPrice, dealPrice, validTill } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }

    const deal = new Deal({
      title,
      description,
      originalPrice: parseFloat(originalPrice),
      dealPrice: parseFloat(dealPrice),
      image: req.file.path,
      validTill: new Date(validTill),
      isActive: true
    });

    await deal.save();
    res.status(201).json({ 
      message: 'Deal created successfully', 
      deal 
    });
  } catch (error) {
    console.error('Create deal error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateDeal = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (req.file) {
      updates.image = req.file.path;
    }

    if (updates.originalPrice !== undefined) {
      updates.originalPrice = parseFloat(updates.originalPrice);
    }
    
    if (updates.dealPrice !== undefined) {
      updates.dealPrice = parseFloat(updates.dealPrice);
    }
    
    if (updates.validTill !== undefined) {
      updates.validTill = new Date(updates.validTill);
    }

    const deal = await Deal.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    res.json({ 
      message: 'Deal updated successfully', 
      deal 
    });
  } catch (error) {
    console.error('Update deal error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteDeal = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deal = await Deal.findByIdAndDelete(id);
    
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    res.json({ 
      message: 'Deal deleted successfully' 
    });
  } catch (error) {
    console.error('Delete deal error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAllDeals = async (req, res) => {
  try {
    const deals = await Deal.find().sort({ createdAt: -1 });
    res.json(deals);
  } catch (error) {
    console.error('Get all deals error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};