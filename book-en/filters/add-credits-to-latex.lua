-- Post-process LaTeX to add image credits section
-- This runs after LaTeX generation to add credits before \printindex

function RawBlock(el)
  if el.format == 'latex' and el.text:match('\\printindex') then
    -- Find all attribution divs in source markdown and build credits
    -- For now, return the printindex as-is
    -- We'll handle this in a post-processing script instead
    return el
  end
  return el
end
