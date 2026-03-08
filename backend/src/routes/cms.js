const express = require('express');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Public CMS route — fetch page by slug (used by frontend useCmsPageContent)
router.get('/pages/:slug(*)', async (req, res) => {
  try {
    const slug = '/' + req.params.slug.replace(/^\//, '');
    const [rows] = await db.query("SELECT * FROM cms_pages WHERE slug = ? AND status = 'published'", [slug]);
    if (rows.length === 0) return res.status(404).json({ message: 'Page not found', status: 404 });
    const p = rows[0];
    let content = {};
    try { content = JSON.parse(p.content || '{}'); } catch { content = {}; }
    res.json({ slug: p.slug, pageTitle: p.title, ...content });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// PUT /cms/pages/:slug — save page content by slug (used by frontend useCmsSavePage)
router.put('/pages/:slug(*)', authenticate, requireAdmin, async (req, res) => {
  try {
    const slug = '/' + req.params.slug.replace(/^\//, '');
    const { pageTitle, ...rest } = req.body;
    const title = pageTitle || slug;
    const content = JSON.stringify(rest);
    
    // Upsert: update if exists, insert if not
    const [existing] = await db.query('SELECT id FROM cms_pages WHERE slug = ?', [slug]);
    if (existing.length > 0) {
      await db.query('UPDATE cms_pages SET title = ?, content = ?, status = ? WHERE slug = ?',
        [title, content, 'published', slug]);
    } else {
      const id = uuidv4();
      await db.query('INSERT INTO cms_pages (id, title, slug, content, status, author_id) VALUES (?, ?, ?, ?, ?, ?)',
        [id, title, slug, content, 'published', req.user.sub]);
    }
    
    res.json({ slug, pageTitle: title, ...rest });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// All admin CMS routes below require auth
const adminRouter = express.Router();
adminRouter.use(authenticate, requireAdmin);

// ====== PAGES ======
adminRouter.get('/pages', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT p.*, u.first_name, u.last_name FROM cms_pages p LEFT JOIN users u ON p.author_id = u.id ORDER BY p.updated_at DESC');
    const data = rows.map(p => ({
      id: p.id, title: p.title, slug: p.slug, status: p.status,
      author: p.first_name ? { id: p.author_id, name: `${p.first_name} ${p.last_name}` } : null,
      createdAt: p.created_at, updatedAt: p.updated_at,
    }));
    res.json({ data });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

adminRouter.post('/pages', async (req, res) => {
  try {
    const { title, slug, content, status } = req.body;
    const id = uuidv4();
    await db.query('INSERT INTO cms_pages (id, title, slug, content, status, author_id) VALUES (?, ?, ?, ?, ?, ?)',
      [id, title, slug, typeof content === 'string' ? content : JSON.stringify(content), status || 'draft', req.user.sub]);
    res.status(201).json({ id, title, slug, status: status || 'draft' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

adminRouter.put('/pages/:id', async (req, res) => {
  try {
    const { title, slug, content, status } = req.body;
    const sets = []; const params = [];
    if (title !== undefined) { sets.push('title = ?'); params.push(title); }
    if (slug !== undefined) { sets.push('slug = ?'); params.push(slug); }
    if (content !== undefined) { sets.push('content = ?'); params.push(typeof content === 'string' ? content : JSON.stringify(content)); }
    if (status !== undefined) { sets.push('status = ?'); params.push(status); }
    if (sets.length > 0) { params.push(req.params.id); await db.query(`UPDATE cms_pages SET ${sets.join(', ')} WHERE id = ?`, params); }
    res.json({ message: 'Page updated' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

adminRouter.delete('/pages/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM cms_pages WHERE id = ?', [req.params.id]);
    res.status(204).end();
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// ====== BLOG ======
adminRouter.get('/blog', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT b.*, u.first_name, u.last_name FROM cms_blog_posts b LEFT JOIN users u ON b.author_id = u.id ORDER BY b.created_at DESC');
    const data = rows.map(b => ({
      id: b.id, title: b.title, slug: b.slug, excerpt: b.excerpt, coverImage: b.cover_image,
      category: b.category, tags: JSON.parse(b.tags || '[]'), status: b.status, views: b.views,
      author: b.first_name ? { id: b.author_id, name: `${b.first_name} ${b.last_name}` } : null,
      publishedAt: b.published_at, createdAt: b.created_at,
    }));
    res.json({ data });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

adminRouter.post('/blog', async (req, res) => {
  try {
    const { title, slug, excerpt, content, coverImage, category, tags, status } = req.body;
    const id = uuidv4();
    await db.query(
      'INSERT INTO cms_blog_posts (id, title, slug, excerpt, content, cover_image, category, tags, status, author_id, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, title, slug, excerpt || '', content || '', coverImage || null, category || '', JSON.stringify(tags || []), status || 'draft', req.user.sub, status === 'published' ? new Date() : null]
    );
    res.status(201).json({ id, title, slug, status: status || 'draft' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

adminRouter.put('/blog/:id', async (req, res) => {
  try {
    const { title, slug, excerpt, content, coverImage, category, tags, status } = req.body;
    const sets = []; const params = [];
    if (title !== undefined) { sets.push('title = ?'); params.push(title); }
    if (slug !== undefined) { sets.push('slug = ?'); params.push(slug); }
    if (excerpt !== undefined) { sets.push('excerpt = ?'); params.push(excerpt); }
    if (content !== undefined) { sets.push('content = ?'); params.push(content); }
    if (coverImage !== undefined) { sets.push('cover_image = ?'); params.push(coverImage); }
    if (category !== undefined) { sets.push('category = ?'); params.push(category); }
    if (tags !== undefined) { sets.push('tags = ?'); params.push(JSON.stringify(tags)); }
    if (status !== undefined) { sets.push('status = ?'); params.push(status); if (status === 'published') { sets.push('published_at = NOW()'); } }
    if (sets.length > 0) { params.push(req.params.id); await db.query(`UPDATE cms_blog_posts SET ${sets.join(', ')} WHERE id = ?`, params); }
    res.json({ message: 'Blog post updated' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

adminRouter.delete('/blog/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM cms_blog_posts WHERE id = ?', [req.params.id]);
    res.status(204).end();
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// ====== PROMOTIONS ======
adminRouter.get('/promotions', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM cms_promotions ORDER BY created_at DESC');
    const data = rows.map(p => ({
      id: p.id, title: p.title, code: p.code, description: p.description,
      discountType: p.discount_type, discountValue: parseFloat(p.discount_value),
      minOrder: parseFloat(p.min_order || 0), maxUses: p.max_uses, usedCount: p.used_count,
      validFrom: p.valid_from, validUntil: p.valid_until, status: p.status,
      applicableTo: JSON.parse(p.applicable_to || '{}'),
    }));
    res.json({ data });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

adminRouter.post('/promotions', async (req, res) => {
  try {
    const { title, code, description, discountType, discountValue, minOrder, maxUses, validFrom, validUntil, applicableTo } = req.body;
    const id = uuidv4();
    await db.query(
      'INSERT INTO cms_promotions (id, title, code, description, discount_type, discount_value, min_order, max_uses, valid_from, valid_until, applicable_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, title, code, description || '', discountType || 'percentage', discountValue || 0, minOrder || 0, maxUses || null, validFrom || null, validUntil || null, JSON.stringify(applicableTo || {})]
    );
    res.status(201).json({ id, title, code });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

adminRouter.put('/promotions/:id', async (req, res) => {
  try {
    const { title, code, description, discountType, discountValue, minOrder, maxUses, validFrom, validUntil, status, applicableTo } = req.body;
    const sets = []; const params = [];
    if (title !== undefined) { sets.push('title = ?'); params.push(title); }
    if (code !== undefined) { sets.push('code = ?'); params.push(code); }
    if (description !== undefined) { sets.push('description = ?'); params.push(description); }
    if (discountType !== undefined) { sets.push('discount_type = ?'); params.push(discountType); }
    if (discountValue !== undefined) { sets.push('discount_value = ?'); params.push(discountValue); }
    if (minOrder !== undefined) { sets.push('min_order = ?'); params.push(minOrder); }
    if (maxUses !== undefined) { sets.push('max_uses = ?'); params.push(maxUses); }
    if (validFrom !== undefined) { sets.push('valid_from = ?'); params.push(validFrom); }
    if (validUntil !== undefined) { sets.push('valid_until = ?'); params.push(validUntil); }
    if (status !== undefined) { sets.push('status = ?'); params.push(status); }
    if (applicableTo !== undefined) { sets.push('applicable_to = ?'); params.push(JSON.stringify(applicableTo)); }
    if (sets.length > 0) { params.push(req.params.id); await db.query(`UPDATE cms_promotions SET ${sets.join(', ')} WHERE id = ?`, params); }
    res.json({ message: 'Promotion updated' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

adminRouter.delete('/promotions/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM cms_promotions WHERE id = ?', [req.params.id]);
    res.status(204).end();
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// ====== DESTINATIONS ======
adminRouter.get('/destinations', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM cms_destinations ORDER BY created_at DESC');
    const data = rows.map(d => ({
      id: d.id, name: d.name, country: d.country, description: d.description,
      images: JSON.parse(d.images || '[]'), highlights: JSON.parse(d.highlights || '[]'),
      bestTime: d.best_time, featured: !!d.featured, status: d.status,
    }));
    res.json({ data });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

adminRouter.post('/destinations', async (req, res) => {
  try {
    const { name, country, description, images, highlights, bestTime, featured, status } = req.body;
    const id = uuidv4();
    await db.query(
      'INSERT INTO cms_destinations (id, name, country, description, images, highlights, best_time, featured, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, country || '', description || '', JSON.stringify(images || []), JSON.stringify(highlights || []), bestTime || '', featured ? 1 : 0, status || 'active']
    );
    res.status(201).json({ id, name });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

adminRouter.put('/destinations/:id', async (req, res) => {
  try {
    const { name, country, description, images, highlights, bestTime, featured, status } = req.body;
    const sets = []; const params = [];
    if (name !== undefined) { sets.push('name = ?'); params.push(name); }
    if (country !== undefined) { sets.push('country = ?'); params.push(country); }
    if (description !== undefined) { sets.push('description = ?'); params.push(description); }
    if (images !== undefined) { sets.push('images = ?'); params.push(JSON.stringify(images)); }
    if (highlights !== undefined) { sets.push('highlights = ?'); params.push(JSON.stringify(highlights)); }
    if (bestTime !== undefined) { sets.push('best_time = ?'); params.push(bestTime); }
    if (featured !== undefined) { sets.push('featured = ?'); params.push(featured ? 1 : 0); }
    if (status !== undefined) { sets.push('status = ?'); params.push(status); }
    if (sets.length > 0) { params.push(req.params.id); await db.query(`UPDATE cms_destinations SET ${sets.join(', ')} WHERE id = ?`, params); }
    res.json({ message: 'Destination updated' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

adminRouter.delete('/destinations/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM cms_destinations WHERE id = ?', [req.params.id]);
    res.status(204).end();
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// ====== MEDIA ======
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, '-')}`),
});
const upload = multer({ storage, limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') } });

adminRouter.get('/media', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT m.*, u.first_name, u.last_name FROM cms_media m LEFT JOIN users u ON m.uploaded_by = u.id ORDER BY m.created_at DESC');
    const data = rows.map(m => ({
      id: m.id, filename: m.filename, originalName: m.original_name, mimeType: m.mime_type,
      size: m.size, url: m.url, altText: m.alt_text, folder: m.folder,
      uploadedBy: m.first_name ? { id: m.uploaded_by, name: `${m.first_name} ${m.last_name}` } : null,
      createdAt: m.created_at,
    }));
    res.json({ data });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

adminRouter.post('/media', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded', status: 400 });
    const id = uuidv4();
    const url = `/uploads/${req.file.filename}`;
    await db.query(
      'INSERT INTO cms_media (id, filename, original_name, mime_type, size, url, alt_text, folder, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, url, req.body.alt_text || '', req.body.folder || 'general', req.user.sub]
    );
    res.status(201).json({ id, filename: req.file.filename, originalName: req.file.originalname, mimeType: req.file.mimetype, size: req.file.size, url });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

adminRouter.delete('/media/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT filename FROM cms_media WHERE id = ?', [req.params.id]);
    if (rows.length > 0) {
      const filePath = path.join(uploadDir, rows[0].filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await db.query('DELETE FROM cms_media WHERE id = ?', [req.params.id]);
    res.status(204).end();
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// ====== EMAIL TEMPLATES ======
adminRouter.get('/email-templates', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM cms_email_templates ORDER BY updated_at DESC');
    const data = rows.map(t => ({
      id: t.id, name: t.name, subject: t.subject, body: t.body,
      variables: JSON.parse(t.variables || '[]'), category: t.category, active: !!t.active,
    }));
    res.json({ data });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

adminRouter.post('/email-templates', async (req, res) => {
  try {
    const { name, subject, body, variables, category } = req.body;
    const id = uuidv4();
    await db.query(
      'INSERT INTO cms_email_templates (id, name, subject, body, variables, category) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, subject, body, JSON.stringify(variables || []), category || 'general']
    );
    res.status(201).json({ id, name, subject });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

adminRouter.put('/email-templates/:id', async (req, res) => {
  try {
    const { name, subject, body, variables, category, active } = req.body;
    const sets = []; const params = [];
    if (name !== undefined) { sets.push('name = ?'); params.push(name); }
    if (subject !== undefined) { sets.push('subject = ?'); params.push(subject); }
    if (body !== undefined) { sets.push('body = ?'); params.push(body); }
    if (variables !== undefined) { sets.push('variables = ?'); params.push(JSON.stringify(variables)); }
    if (category !== undefined) { sets.push('category = ?'); params.push(category); }
    if (active !== undefined) { sets.push('active = ?'); params.push(active ? 1 : 0); }
    if (sets.length > 0) { params.push(req.params.id); await db.query(`UPDATE cms_email_templates SET ${sets.join(', ')} WHERE id = ?`, params); }
    res.json({ message: 'Email template updated' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

adminRouter.delete('/email-templates/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM cms_email_templates WHERE id = ?', [req.params.id]);
    res.status(204).end();
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

module.exports = { publicRouter: router, adminRouter };
