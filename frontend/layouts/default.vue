<template>
  <div>
    <Navbar />
    <div class="flex flex-col min-h-full justify-between">
      <div class="p-4 lg:p-8 w-screen overflow-x-hidden">
        <slot />
      </div>
      <Footer />
    </div>
  </div>
</template>

<script setup lang="ts">
</script>
