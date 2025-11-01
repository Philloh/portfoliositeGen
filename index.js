const fs = require('fs-extra');
const yaml = require('js-yaml');
const marked = require('marked');
const ejs = require('ejs');
const path = require('path');
const { program } = require('commander');
const ghpages = require('gh-pages');

// Paths
const configPath = path.join(__dirname, 'config.yaml');
const templatePath = path.join(__dirname, 'templates/index.ejs');
const distPath = path.join(__dirname, 'dist');
const assetsPath = path.join(__dirname, 'assets');

// Build command
program
  .command('build')
  .description('Build the static site')
  .action(async () => {
    try {
      // Read and parse YAML config
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));

      // Convert Markdown fields to HTML
      config.about = marked.parse(config.about || '');
      config.projects = config.projects.map(project => ({
        ...project,
        description: marked.parse(project.description || '')
      }));

      // Render EJS template with data
      const template = fs.readFileSync(templatePath, 'utf8');
      const html = await ejs.render(template, { config });

      // Create dist folder and write HTML
      await fs.ensureDir(distPath);
      fs.writeFileSync(path.join(distPath, 'index.html'), html);

      // Copy Bootstrap and assets (CSS/JS from node_modules)
      await fs.copy(path.join(__dirname, 'node_modules/bootstrap/dist/css'), path.join(distPath, 'css'));
      await fs.copy(path.join(__dirname, 'node_modules/bootstrap/dist/js'), path.join(distPath, 'js'));
      await fs.copy(path.join(__dirname, 'node_modules/jquery/dist'), path.join(distPath, 'js'));
      await fs.copy(path.join(__dirname, 'node_modules/@popperjs/core/dist/umd'), path.join(distPath, 'js/popper'));
      if (fs.existsSync(assetsPath)) {
        await fs.copy(assetsPath, path.join(distPath, 'assets'));
      }

      console.log('Build complete! Site generated in dist/');
    } catch (err) {
      console.error('Build failed:', err);
    }
  });

// Deploy command
program
  .command('deploy')
  .description('Deploy to GitHub Pages')
  .action(() => {
    ghpages.publish(distPath, {
      branch: 'gh-pages',
      repo: 'https://github.com/yourusername/your-repo.git', // Update with your repo URL
      user: {
        name: 'Your Name',
        email: 'your@email.com'
      },
      message: 'Auto-deploy from generator'
    }, err => {
      if (err) console.error('Deploy failed:', err);
      else console.log('Deployed to GitHub Pages!');
    });
  });

program.parse(process.argv);