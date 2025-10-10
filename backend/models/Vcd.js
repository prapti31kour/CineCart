import mongoose from 'mongoose';

const VcdSchema = new mongoose.Schema({
  vcdImage: {
    // allow many image links (gallery), keep backward compatibility
    type: [String],
    required: true,
    default: []
  },
  vcdID: {
    type: String,
    required: true,
    unique: true,
  },
  vcdName: {
    type: String,
    required: true,
  },

  /* new descriptive fields for recommender */
  summary: {
    type: String, // short movie summary / blurb — useful for text features
    trim: true,
    default: ''
  },
  year: {
    type: Number, // year of release
    index: true,
    min: 1878 // first commercial films ~1878; sanity lower bound
  },
  // cast split into leads (primary) and supporting / most-shown
  cast: {
    leads: { type: [String], default: [] },   // primary leads (strings)
    featured: { type: [String], default: [] } // frequently shown / supporting cast
  },

  // genre metadata and free-form tags for fine-grained matching
  genre: {
    primary: { type: String, default: '' },   // e.g., "Action", "Drama"
    tags: { type: [String], default: [] }     // e.g., ["heist", "revenge", "period"]
  },

  language: {
    type: String,
  },
  category: {
    type: String,
    enum: ['Hollywood', 'Bollywood', 'Regional'],
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
  },
  cost: {
    type: Number,
    required: true,
  },

  // optional useful metadata
  director: { type: String, default: '' },
  runtimeMinutes: { type: Number, min: 0 }, // runtime in minutes
}, { timestamps: true });

/* Indexes to help recommender and search:
   - Text index on name + summary for quick semantic/title search
   - Indexes on tags, cast leads, and year for fast filtering
*/
VcdSchema.index({ vcdName: 'text', summary: 'text' });
VcdSchema.index({ 'genre.tags': 1 });
VcdSchema.index({ 'cast.leads': 1 });
VcdSchema.index({ year: -1 });

const Vcd = mongoose.model('Vcd', VcdSchema, 'vcds');
export default Vcd;














// import mongoose from 'mongoose';
 
// const VcdSchema = new mongoose.Schema({
//   vcdImage: {
//     type: String,
//     required: true
//   },
//   vcdID: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   vcdName: {
//     type: String,
//     required: true,
//   },
//   language: {
//     type: String,
//   },
//   category: {
//     type: String,
//     enum: ['Hollywood', 'Bollywood', 'Regional'],
//   },
//   rating: {
//     type: Number,
//     min: 1,
//     max: 5,
//   },
//   quantity: {
//     type: Number,
//     required: true,
//     default: 0,
//   },
//   cost: {
//     type: Number,
//     required: true,
//   },
// });
 
// const Vcd = mongoose.model('Vcd', VcdSchema, 'vcds');
// export default Vcd;
