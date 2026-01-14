-- Pandoc Lua filter to collect image attributions for PDF
-- In HTML: attributions stay inline
-- In PDF: attributions are collected at the end

-- Global variable to persist across multiple files
if not _G.image_attributions then
  _G.image_attributions = {}
end
local attributions = _G.image_attributions

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
    -- Store attribution content for later
    table.insert(attributions, el.content)
    
    -- For PDF/LaTeX: return a reference number instead
    -- For HTML: return the div with target="_blank" added to links
    if FORMAT == 'latex' then
      local ref_num = #attributions
      return pandoc.Para({
        pandoc.Str('[' .. ref_num .. ']')
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

function Doc(body, meta, vars)
  -- Only add collected attributions for PDF/LaTeX at the end
  -- Check format - could be 'latex' when outputting to .tex file
  local is_latex_output = FORMAT == 'latex'
  
  if is_latex_output and #attributions > 0 then
    -- Create credits as Pandoc blocks
    local credit_blocks = {}
    
    -- Add chapter heading
    table.insert(credit_blocks, pandoc.Header(1, 'Image Credits'))
    table.insert(credit_blocks, pandoc.Blank())
    
    -- Create list items for each attribution
    local list_items = {}
    for i, attr_content in ipairs(attributions) do
      -- Create a plain text item with the attribution
      local item_text = {'[' .. i .. '] '}
      -- Add the content from the attribution
      for _, block in ipairs(attr_content) do
        if block.t == 'Para' or block.t == 'Plain' then
          for _, inline in ipairs(block.content) do
            table.insert(item_text, inline)
          end
        end
      end
      table.insert(list_items, pandoc.Plain(item_text))
    end
    
    -- Add the bullet list
    table.insert(credit_blocks, pandoc.BulletList(list_items))
    
    -- Append all credit blocks to the document
    for _, block in ipairs(credit_blocks) do
      table.insert(body, block)
    end
  end
  
  return pandoc.Doc(body, meta)
end
