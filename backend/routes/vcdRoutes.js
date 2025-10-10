// backend/routes/vcdRoutes.js
import express from 'express';
import Vcd from '../models/Vcd.js';
import User from '../models/User.js';
import isAdmin from '../middleware/isAdmin.js';
import { verifyTokenMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST: Add a new VCD (admin only)
router.post('/', verifyTokenMiddleware, isAdmin, async (req, res) => {
  try {
    const vcd = new Vcd(req.body);
    await vcd.save();
    res.status(201).json({ message: 'VCD added successfully', data: vcd });
  } catch (err) {
    console.error('POST /api/vcds error:', err);
    res.status(400).json({ error: err.message });
  }
});

// DELETE: Delete VCD by Name (admin only)
router.delete('/by-name/:name', verifyTokenMiddleware, isAdmin, async (req, res) => {
  try {
    const deleted = await Vcd.findOneAndDelete({ vcdName: req.params.name });
    if (!deleted) return res.status(404).json({ error: 'VCD not found' });
    res.json({ message: 'VCD deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/vcds/by-name error:', err);
    res.status(500).json({ error: 'Deletion failed' });
  }
});

// PATCH: Update VCD by Name (admin only)
router.patch('/by-name/:name', verifyTokenMiddleware, isAdmin, async (req, res) => {
  try {
    const updateFields = { ...req.body };
    const updated = await Vcd.findOneAndUpdate(
      { vcdName: req.params.name },
      updateFields,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'VCD not found' });
    res.json({ message: 'VCD updated successfully', data: updated });
  } catch (err) {
    console.error('PATCH /api/vcds/by-name error:', err);
    res.status(500).json({ error: 'Update failed' });
  }
});

// GET: Get all VCDs (public)
router.get('/', async (req, res) => {
  try {
    const vcds = await Vcd.find().lean();
    res.json(vcds);
  } catch (err) {
    console.error('GET /api/vcds error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/vcds/by-ids?ids=ID1,ID2,ID3
 * Returns matching VCD docs by custom key vcdID.
 */
router.get('/by-ids', async (req, res) => {
  try {
    const ids = String(req.query.ids || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (!ids.length) return res.json([]);

    const vcds = await Vcd.find({ vcdID: { $in: ids } }).lean();
    return res.json(vcds);
  } catch (err) {
    console.error('GET /api/vcds/by-ids error:', err);
    return res.status(500).json({ message: 'Failed to fetch VCDs' });
  }
});

// GET: Get full VCD details by vcdID
router.get('/by-id/:vcdID', async (req, res) => {
  try {
    const vcdID = String(req.params.vcdID || '').trim();
    if (!vcdID) return res.status(400).json({ message: 'vcdID is required' });

    const vcd = await Vcd.findOne({ vcdID }).lean();

    if (!vcd) {
      return res.status(404).json({ message: 'VCD not found' });
    }

    res.json(vcd);
  } catch (err) {
    console.error('GET /api/vcds/by-id error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/vcds/decrease
 * Body: { vcdName?: string, vcdID?: string, quantity: number }
 * Accepts vcdName or vcdID. Ensures quantity > 0 and enough stock exists.
 */
router.patch('/decrease', async (req, res) => {
  try {
    const { vcdName, vcdID } = req.body || {};
    const quantity = Number(req.body?.quantity ?? 0);

    if ((!vcdName && !vcdID) || !Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({ error: "vcdName or vcdID and positive quantity are required" });
    }

    const query = vcdID ? { vcdID } : { vcdName };

    // ensure enough stock and decrease
    const updated = await Vcd.findOneAndUpdate(
      { ...query, quantity: { $gte: quantity } },
      { $inc: { quantity: -quantity } },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ error: "VCD not found or insufficient quantity" });
    }

    res.json({
      message: `Quantity of '${vcdName || vcdID}' decreased by ${quantity}`,
      data: updated
    });
  } catch (err) {
    console.error('PATCH /api/vcds/decrease error:', err);
    res.status(500).json({ error: "Failed to decrease quantity" });
  }
});

// GET /api/vcds/images/:vcdID
// router.get('/images/:vcdID', async (req, res) => {
//   try {
//     const vcdID = String(req.params.vcdID || '').trim();
//     if (!vcdID) {
//       return res.status(400).json({ message: 'vcdID is required in params' });
//     }

//     const vcd = await Vcd.findOne({ vcdID }).select('vcdImage vcdName vcdID').lean();

//     if (!vcd) {
//       return res.status(404).json({ message: `VCD with id '${vcdID}' not found` });
//     }

//     const images = Array.isArray(vcd.vcdImage) ? vcd.vcdImage : (vcd.vcdImage ? [vcd.vcdImage] : []);

//     return res.json({
//       vcdID: vcd.vcdID,
//       vcdName: vcd.vcdName,
//       images
//     });
//   } catch (err) {
//     console.error('GET /api/vcds/images/:vcdID error:', err);
//     return res.status(500).json({ message: 'Failed to fetch images' });
//   }
// });
router.get('/images/:vcdID', verifyTokenMiddleware, async (req, res) => {
  try {
    const vcdID = String(req.params.vcdID || '').trim();

    if (!vcdID) {
      return res.status(400).json({ message: 'vcdID is required in params' });
    }

    const vcd = await Vcd.findOne({ vcdID }).select('vcdImage vcdName vcdID').lean();

    if (!vcd) {
      return res.status(404).json({ message: `VCD with id '${vcdID}' not found` });
    }

    const images = Array.isArray(vcd.vcdImage)
      ? vcd.vcdImage
      : vcd.vcdImage
      ? [vcd.vcdImage]
      : [];

    return res.json({
      vcdID: vcd.vcdID,
      vcdName: vcd.vcdName,
      images,
    });
  } catch (err) {
    console.error('GET /api/vcds/images/:vcdID error:', err);
    return res.status(500).json({ message: 'Failed to fetch images' });
  }
});

export default router;




















// import express from 'express';
// import Vcd from '../models/Vcd.js'; // Make sure the file extension is included
// import isAdmin from '../middleware/isAdmin.js';
// const router = express.Router();


// // ✅ POST: Add a new VCD (admin only)
// router.post('/', async (req, res) => {
//   try {
//     const vcd = new Vcd(req.body);
//     await vcd.save();
//     res.status(201).json({ message: 'VCD added successfully', data: vcd });
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });
 
// // ✅ DELETE: Delete VCD by Name (admin only)
// router.delete('/by-name/:name', async (req, res) => {
//   const { email, password } = req.body;
//   if (email !== 'admin@example.com' || password !== 'admin123') {
//     return res.status(403).json({ error: 'Unauthorized access' });
//   }
 
//   try {
//     const deleted = await Vcd.findOneAndDelete({ vcdName: req.params.name });
//     if (!deleted) return res.status(404).json({ error: 'VCD not found' });
//     res.json({ message: 'VCD deleted successfully' });
//   } catch (err) {
//     res.status(500).json({ error: 'Deletion failed' });
//   }
// });
 
// // ✅ PATCH: Update VCD by Name (admin only)
// router.patch('/by-name/:name', async (req, res) => {
//   const { email, password, ...updateFields } = req.body;
//   if (email !== 'admin@example.com' || password !== 'admin123') {
//     return res.status(403).json({ error: 'Unauthorized access' });
//   }
 
//   try {
//     const updated = await Vcd.findOneAndUpdate(
//       { vcdName: req.params.name },
//       updateFields,
//       { new: true }
//     );
//     if (!updated) return res.status(404).json({ error: 'VCD not found' });
//     res.json({ message: 'VCD updated successfully', data: updated });
//   } catch (err) {
//     res.status(500).json({ error: 'Update failed' });
//   }
// });
 
// // ✅ GET: Get all VCDs (public)
// router.get('/', async (req, res) => {
//   try {
//     const vcds = await Vcd.find();
//     res.json(vcds);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });



// /**
//  * GET /api/vcds/by-ids?ids=ID1,ID2,ID3
//  * Returns matching VCD docs by custom key vcdID.
//  */
// router.get('/by-ids', async (req, res) => {
//   try {
//     const ids = String(req.query.ids || '')
//       .split(',')
//       .map(s => s.trim())
//       .filter(Boolean);

//     if (!ids.length) return res.json([]);

//     const vcds = await Vcd.find({ vcdID: { $in: ids } }).lean();
//     return res.json(vcds);
//   } catch (err) {
//     console.error('GET /api/vcds/by-ids error:', err);
//     return res.status(500).json({ message: 'Failed to fetch VCDs' });
//   }
// });

// //get by vcd id
// // // GET: Get full VCD details by vcdID
// router.get('/by-id/:vcdID', async (req, res) => {
//   try {
//     const vcdID = req.params.vcdID;
 
//     const vcd = await Vcd.findOne({ vcdID });
 
//     if (!vcd) {
//       return res.status(404).json({ message: 'VCD not found' });
//     }
 
//     res.json(vcd);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });


// router.patch('/decrease', async (req, res) => {
//   const { vcdName, quantity } = req.body; // both from body
 
//   if (!vcdName || !quantity || quantity <= 0) {
//     return res.status(400).json({ error: "vcdName and positive quantity are required" });
//   }
 
//   try {
//     const updated = await Vcd.findOneAndUpdate(
//       { vcdName, quantity: { $gte: quantity } }, // ensure enough stock
//       { $inc: { quantity: -quantity } },         // decrease by given qty
//       { new: true }
//     );
 
//     if (!updated) {
//       return res.status(404).json({ error: "VCD not found or insufficient quantity" });
//     }
 
//     res.json({
//       message: `Quantity of '${vcdName}' decreased by ${quantity}`,
//       data: updated
//     });
//   } catch (err) {
//     res.status(500).json({ error: "Failed to decrease quantity" });
//   }
// });



// // GET /api/vcds/images/:vcdID
// // Returns image links for the given vcdID as an array
// router.get('/images/:vcdID', async (req, res) => {
//   try {
//     const vcdID = String(req.params.vcdID || '').trim();
//     if (!vcdID) {
//       return res.status(400).json({ message: 'vcdID is required in params' });
//     }

//     // only select the image field (and optional metadata)
//     const vcd = await Vcd.findOne({ vcdID }).select('vcdImage vcdName vcdID').lean();

//     if (!vcd) {
//       return res.status(404).json({ message: `VCD with id '${vcdID}' not found` });
//     }

//     // normalize to array so client always receives an array of links
//     const images = Array.isArray(vcd.vcdImage) ? vcd.vcdImage : (vcd.vcdImage ? [vcd.vcdImage] : []);

//     return res.json({
//       vcdID: vcd.vcdID,
//       vcdName: vcd.vcdName,
//       images
//     });
//   } catch (err) {
//     console.error('GET /api/vcds/images/:vcdID error:', err);
//     return res.status(500).json({ message: 'Failed to fetch images' });
//   }
// });




// export default router;
