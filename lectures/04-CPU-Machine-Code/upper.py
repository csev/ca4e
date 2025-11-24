
mem = "Hello"
newmem = ""

for xr in range(len(mem)):
  acc = mem[xr:xr+1]
  if acc >= 'a' and acc <= 'z' :
     acc = chr(ord(acc) - ord('a') + ord('A'))

  newmem = newmem + acc

print(newmem)

