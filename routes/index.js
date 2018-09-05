const url = require('url');
const fs = require('fs');
const express = require('express');
const puppeteer = require('puppeteer');
const validator = require('validator');
const router = express.Router();
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

/* GET home page. */
router.get('/', csrfProtection, function (req, res, next) {
  res.render('index', { title: 'Express', csrfToken: req.csrfToken() });
});

router.post('/', csrfProtection, async function (req, res, next) {
  const { screenshot } = req.body;

  if (!screenshot || false === validator.isURL(screenshot)) {
    return res.render('index', {
      title: 'False!',
      csrfToken: req.csrfToken(),
      messages: { warning: ['Not a valid url'] },
    });
  }

  const myURL = new url.parse(screenshot);
  const slash = new RegExp(/^\/+/g);
  const replace = new RegExp(/[^a-z0-9]/g);
  let uri = myURL.path;
  uri = uri.replace(slash, '');
  uri = uri.replace(replace, '-');
  if (uri === '') {
    uri = 'index';
  }
  const dirName = req.app.get('imagedir') + '/' + myURL.host;
  const isDir = await fs.existsSync(dirName);
  if (false === isDir) {
    await fs.mkdirSync(dirName);
  }

  let images = [];
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(screenshot);

  await page.setViewport({ width: 375, height: 667 });
  await page.screenshot({ path: dirName + '/' + uri + '-xs.png' });
  images.push({ title: 'Phone', url: '/images/' + myURL.host + '/' + uri + '-xs.png' });
  await page.setViewport({ width: 768, height: 1024 });
  await page.screenshot({ path: dirName + '/' + uri + '-md.png' });
  images.push({ title: 'Tablet portrait', url: '/images/' + myURL.host + '/' + uri + '-md.png' });
  await page.setViewport({ width: 1024, height: 768 });
  await page.screenshot({ path: dirName + '/' + uri + '-lg.png' });
  images.push({ title: 'Tablet landscape', url: '/images/' + myURL.host + '/' + uri + '-lg.png' });
  await page.setViewport({ width: 1920, height: 1080 });
  await page.screenshot({ path: dirName + '/' + uri + '-xl.png' });
  images.push({ title: 'Desktop', url: '/images/' + myURL.host + '/' + uri + '-xl.png' });
  await browser.close();

  return res.render('index', {
    title: 'Post',
    csrfToken: req.csrfToken(),
    messages: { success: ['Screenshot was made'] },
    images,
  });
});

module.exports = router;
