const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Song = require('../models/Song');
const Playlist = require('../models/Playlist');

dotenv.config({ path: __dirname + '/../.env' });

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cloudbeats';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB...');

    // 1. Create or ensure Admin account
    let admin = await User.findOne({ email: 'admin@cloudbeats.io' });
    if (!admin) {
      admin = await User.create({
        name: 'CloudBeats Admin',
        email: 'admin@cloudbeats.io',
        password: 'adminpassword123',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      });
      console.log('[Seed] Admin account created: admin@cloudbeats.io / adminpassword123');
    } else {
      console.log('[Seed] Admin account already exists.');
    }

    // 2. Create or ensure regular test user
    let user = await User.findOne({ email: 'user@cloudbeats.io' });
    if (!user) {
      user = await User.create({
        name: 'Demo Listener',
        email: 'user@cloudbeats.io',
        password: 'userpassword123',
        role: 'user',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      });
      console.log('[Seed] Demo User created: user@cloudbeats.io / userpassword123');
    }

    // 3. Check if songs exist, if none seed starter songs
    const songCount = await Song.countDocuments();
    if (songCount === 0) {
      const sampleSongs = [
        {
          title: 'Cyberpulse Midnight',
          artist: 'Neon Horizon',
          album: 'Obsidian Glow',
          genre: 'Electronic',
          audioKey: 'music/sample-cyberpulse-midnight.mp3',
          coverKey: 'covers/sample-cyberpulse-midnight.jpg',
          duration: 218,
          uploadedBy: admin._id,
          plays: 420,
        },
        {
          title: 'Emerald Mirage',
          artist: 'Aetheria',
          album: 'Quantum Reverie',
          genre: 'Synthwave',
          audioKey: 'music/sample-emerald-mirage.mp3',
          coverKey: 'covers/sample-emerald-mirage.jpg',
          duration: 195,
          uploadedBy: admin._id,
          plays: 285,
        },
        {
          title: 'Purple Velvet Skyline',
          artist: 'Kroma Sound',
          album: 'Nightfall Sessions',
          genre: 'Lo-Fi Chill',
          audioKey: 'music/sample-purple-velvet-skyline.mp3',
          coverKey: 'covers/sample-purple-velvet-skyline.jpg',
          duration: 174,
          uploadedBy: admin._id,
          plays: 512,
        },
      ];

      const inserted = await Song.insertMany(sampleSongs);
      console.log(`[Seed] Seeded ${inserted.length} sample songs.`);

      // Seed a starter playlist
      await Playlist.create({
        name: 'Obsidian Favorites',
        description: 'Vibrant neon beats curated for late night focus and energy.',
        user: admin._id,
        songs: inserted.map((s) => s._id),
        isPublic: true,
      });
      console.log('[Seed] Sample playlist created.');
    } else {
      console.log(`[Seed] Database already has ${songCount} songs.`);
    }

    console.log('[Seed] Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;

