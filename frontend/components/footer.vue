<template>
  <div class="flex justify-between border-t-[1px] border-gray-700 p-2">
    <div class="text-center text-xs">
      commit
      <CustomLink :url="getLinkToCommit(commitHash)">
        {{ commitHash }}
      </CustomLink><br>
      built on
      {{ buildDate.toLocaleDateString('de-DE') }}
    </div>
    Created with&nbsp;
    <div class="flex justify-end">
      <template v-for="(dependency, index) in notableDependencies" :key="dependency.name">
        <CustomLink :url="dependency.url">
          {{ dependency.name }}
        </CustomLink>{{ index === notableDependencies.length - 1 ? '.' : ',&nbsp;' }}
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getLinkToCommit } from '~/utils/gitHubRepo';

const runtimeConfig = useRuntimeConfig();

const { commitHash } = runtimeConfig.public;
const buildDate = new Date(runtimeConfig.public.buildDate);

const notableDependencies = [
  { name: 'Nuxt', packageName: 'nuxt', url: new URL('https://nuxt.com/') },
  {
    name: 'TypeScript',
    url: new URL('https://www.typescriptlang.org/'),
  },
  {
    name: 'Tailwind CSS',
    url: new URL('https://tailwindcss.com/'),
  },
];
</script>
