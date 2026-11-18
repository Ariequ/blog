# 尚小夏

尚小夏的博客存档，发布在 <https://ariequ.github.io/blog/>。

文章从 Internet Archive 的 Wayback Machine 找回，正文照录。收录博客大巴 shangxxia.blogbus.com（2008 年 5 月至 2012 年 3 月）和新浪博客（2006 年至 2010 年）。另有饭否消息 574 条（2008–2013，以及 2026-11-18）。首页是一条阅读流：饭否显示全文和照片，博客显示摘要，每次 30 条。饭否仍可在 `/fanfou/` 按年月浏览。站点用 GitHub Pages 自带的 Jekyll 生成，基路径是 `/blog/`。

## 目录

- `_blogbus/`：博客大巴的文章
- `_sina/`：新浪博客的文章。再放进带同样头信息的 Markdown，首页会按来源和年份列出来
- `fanfou/`：饭否消息，按年月分页
- `letters/`：2009 年手写信转写，部分页面月日未详，不计入首页 931 条。另有日期未确认的明信片影像
- `assets/letters/`：手写信四页原图、摄影明信片正面总览，以及两张背面遮挡副本
- `assets/fanfou/`：饭否照片（596 像素宽的页面展示图）和可下载的 JSON、CSV
- `index.html`：统一时间线
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

手写信和明信片的图片都在 `assets/letters/`，用站点相对路径，不放外链图床。

| 文件 | 是什么 |
| --- | --- |
| `xiangxin-yongyuan-page-1.jpg` | 手写信第 1 页原图，2009年4月8日上午11:05 |
| `xiangxin-yongyuan-page-2.jpg` | 手写信第 2 页原图，疑似续页，没有自己的月日 |
| `xiangxin-yongyuan-page-3.jpg` | 手写信第 3 页原图，第六日，不补月日 |
| `xiangxin-yongyuan-page-4.jpg` | 折页原图，题句「你让我想要相信永远」 |
| `postcards-fronts.jpg` | 八张摄影明信片正面的同一张总览原图，不拆分，日期未确认 |
| `postcards-backs-01-redacted.jpg` | 背面遮挡公开副本，不是未改动原图 |
| `postcards-backs-02-redacted.jpg` | 背面遮挡公开副本，不是未改动原图 |

通信文字涉及个人隐私，背面以遮挡版展示；完整原图另存。未遮挡的背面不在这个仓库里。

## 本地预览

```bash
bundle install
bundle exec jekyll serve
```

打开 <http://127.0.0.1:4000/blog/>。
