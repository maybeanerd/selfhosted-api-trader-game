<template>
  <NConfigProvider
    :theme="darkTheme"
    :locale="enUS"
    :date-locale="dateDeDE"
    class="h-screen"
  >
    <Navbar />
    <NBackTop :right="20" />
    <div class="flex flex-col min-h-full justify-between">
      <Header />
      <div class="p-4 lg:p-8 w-screen overflow-x-hidden">
        <slot />
      </div>
      <Footer />
    </div>
  </NConfigProvider>
</template>

<script setup lang="ts">
import { NConfigProvider, darkTheme, enUS, dateDeDE, NBackTop } from 'naive-ui';
</script>
