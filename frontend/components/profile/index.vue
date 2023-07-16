<template>
  <div class="flex">
    <div class="max-lg:hidden flex-shrink-0 w-72 m-4 flex flex-col">
      <ProfilePerson :person="props.profile.person" />
      <ProfileSkills :skills="props.profile.skills" />
    </div>
    <div class="flex flex-col m-4">
      <div class="lg:hidden">
        <ProfilePerson :person="props.profile.person" />
        <ProfileSkills :skills="props.profile.skills" />
      </div>
      <ProfileProjects :projects="props.profile.projects" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Profile } from '~/server/profile.types';

const props = defineProps<{ profile: Profile }>();

</script>
