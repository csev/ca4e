-- Pandoc Lua filter to collect image attributions for PDF
-- In HTML: attributions stay inline
-- In PDF: attributions are collected at the end via post-processing script

-- Track figures per chapter for numbering
local current_chapter = 0  -- Will be set to 1 on first chapter header
local figure_count = 0
local first_chapter_seen = false

-- Helper function to add target="_blank" to all links
function add_target_blank(inline)
  if inline.t == 'Link' then
    inline.attr.attributes.target = '_blank'
    return inline
  elseif inline.t == 'Span' or inline.t == 'Emph' or inline.t == 'Strong' then
    -- Recursively process content
    local new_content = {}
    for _, item in ipairs(inline.content) do
      table.insert(new_content, add_target_blank(item))
    end
    inline.content = new_content
    return inline
  else
    return inline
  end
end

function Header(el)
  -- Detect chapter headers (level 1) to reset figure counter
  if el.level == 1 and FORMAT == 'latex' then
    if not first_chapter_seen then
      current_chapter = 1
      first_chapter_seen = true
    else
      current_chapter = current_chapter + 1
    end
    figure_count = 0
  end
  return el
end

function Image(el)
  -- Track images to count figures per chapter
  -- Increment when we see an image
  if FORMAT == 'latex' then
    figure_count = figure_count + 1
  end
  return el
end

function Div(el)
  if el.classes:includes('image-attribution') then
    -- For PDF/LaTeX: return a reference with figure number
    -- For HTML: return the div with target="_blank" added to links
    if FORMAT == 'latex' then
      -- The image should have been processed before this div, so figure_count should be correct
      -- But if it's 0, it means we haven't seen the image yet, so increment it
      if figure_count == 0 then
        figure_count = 1
      end
      local fig_ref = string.format("%d.%d", current_chapter, figure_count)
      -- Format as centered, smaller text to stay within margins
      return pandoc.RawBlock('latex', 
        '\\begin{center}\\small[' .. fig_ref .. ']\\end{center}')
    else
      -- HTML: keep inline but add target="_blank" to all links
      local new_content = {}
      for _, block in ipairs(el.content) do
        if block.t == 'Para' or block.t == 'Plain' then
          local new_inlines = {}
          for _, inline in ipairs(block.content) do
            table.insert(new_inlines, add_target_blank(inline))
          end
          if block.t == 'Para' then
            table.insert(new_content, pandoc.Para(new_inlines))
          else
            table.insert(new_content, pandoc.Plain(new_inlines))
          end
        else
          table.insert(new_content, block)
        end
      end
      el.content = new_content
      return el
    end
  end
end
