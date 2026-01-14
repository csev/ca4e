-- Pandoc Lua filter to collect image attributions for PDF
-- In HTML: attributions stay inline
-- In PDF: attributions are collected at the end via post-processing script

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

function Div(el)
  if el.classes:includes('image-attribution') then
    -- For PDF/LaTeX: return a reference number (credits added via post-processing)
    -- For HTML: return the div with target="_blank" added to links
    if FORMAT == 'latex' then
      -- Count existing references to determine number
      -- This is approximate - the post-processing script will handle the actual numbering
      return pandoc.Para({
        pandoc.Str('[1]')
      })
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
