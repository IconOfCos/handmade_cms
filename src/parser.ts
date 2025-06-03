import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { generateSlug } from './utils.js';

export interface PostData {
  title: string;
  date: string;
  slug: string;
  content: string;
  excerpt?: string;
  tags?: string[];
  [key: string]: any;
}

export class MarkdownParser {
  constructor() {
    marked.setOptions({
      gfm: true,
      breaks: true,
    });
  }

  async parseFile(filePath: string): Promise<PostData> {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const { data: frontmatter, content } = matter(fileContent);
    
    const title = frontmatter.title || path.basename(filePath, '.md');
    const slug = frontmatter.slug || generateSlug(title);
    const date = frontmatter.date || new Date().toISOString().split('T')[0];
    
    const htmlContent = await marked(content);
    
    return {
      title,
      date,
      slug,
      content: htmlContent,
      excerpt: frontmatter.excerpt,
      tags: frontmatter.tags,
      ...frontmatter,
    };
  }

  async parseDirectory(dirPath: string): Promise<PostData[]> {
    const files = await fs.readdir(dirPath);
    const markdownFiles = files.filter(file => file.endsWith('.md'));
    
    const posts: PostData[] = [];
    
    for (const file of markdownFiles) {
      const filePath = path.join(dirPath, file);
      const post = await this.parseFile(filePath);
      posts.push(post);
    }
    
    return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}