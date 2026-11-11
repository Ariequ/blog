# 尚小夏

尚小夏的博客存档，发布在 <https://ariequ.github.io/blog/>。

文章从 Internet Archive 的 Wayback Machine 找回，正文照录。收录两部分：博客大巴 shangxxia.blogbus.com（2008 年 5 月至 2012 年 3 月），和新浪博客（2006 年至 2010 年）。站点用 GitHub Pages 自带的 Jekyll 生成，基路径是 `/blog/`。

## 目录

- `_blogbus/`：博客大巴的文章
- `_sina/`：新浪博客的文章。再放进带同样头信息的 Markdown，首页会按来源和年份列出来
- `index.html`：目录
- `_layouts/`：版式
- `assets/style.css`：样式

新浪文章可以沿用这样的头信息，正文原样写在下面：

```yaml
---
layout: post
title: "标题"
date: 2013-01-01 12:00:00 +0800
date_text: "2013-01-01 12:00"
year: 2013
list_date: "1月1日"
list_time: "12:00"
category_label: "随感"
source_label: "新浪博客"
original_url: "https://blog.sina.com.cn/..."
archive_url: "https://web.archive.org/..."
photos_missing: false
permalink: /sina/2013-01-01-slug/
---
```

`date` 使用 `+0800`。没有具体钟点时去掉 `list_time`。`photos_missing: true` 时，页面会注明图片已经丢失。

## 本地预览

```bash
bundle install
bundle exec jekyll serve
```

打开 <http://127.0.0.1:4000/blog/>。
