<script context="module">
  import { tick } from "svelte";
  import { writable } from "svelte/store";
  import Menu, { onClickActivator } from './Menu.svelte';
  import _ from "/utils/intl.js";
  const items = writable();

  export function openContextMenu(i, e) {
    items.set(i);
    onClickActivator(e);
  }
</script>

<script>
  async function action({ cb }) {
    cb();

    $items = false;
  }
</script>


<Menu bind:open={$items} class="flex items-center mr-2">
  <div slot="activator">
    <slot></slot>
  </div>
  <ul class="text-xs py-1 w-auto max-w-sm truncate">
    {#each ($items || []) as i}
      <li
        class="py-1 cursor-pointer select-none px-2 hover:bg-gray-500 hover:text-white"
        on:click={() => action(i)}
      >{$_(i.text)}</li>
    {/each}
  </ul>
</Menu>
