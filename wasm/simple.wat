(module
  ;; Import console.log from JavaScript
  (import "console" "log" (func $log (param i32 i32)))
  
  ;; Memory section - 1 page (64KB)
  (memory 1)
  
  ;; Data section - store "Hello, World!" string at offset 0
  (data (i32.const 0) "Hello, World!")
  
  ;; Export memory so JavaScript can access it
  (export "memory" (memory 0))
  
  ;; Main function that calls console.log
  (func $main
    ;; Call console.log with pointer 0 and length 13
    (call $log (i32.const 0) (i32.const 13))
  )
  
  ;; Export main function
  (export "main" (func $main))
)
