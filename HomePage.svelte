<script>
  import { createEventDispatcher, onMount } from "svelte";
  import Input from "/components/Input.svelte";
  import Scrim from "/components/Scrim.svelte";
  import ProfileForm from "/components/ProfileForm.svelte";
  import _ from "/utils/intl.js";
  import { language, defaultProfile, store } from "/store.js";
  import { connect, updateProfile } from "/models/profile.js";

  export let loading = true;

  const dispatch = createEventDispatcher();

  let data = { ...defaultProfile };
  let errors = { ...defaultProfile };
  let error = "";
  let email = "";
  let password = "";
  let showEmailNotification = false;
  let shouldResetPassword = false;

  async function register() {
    try {
      error = false;

      Object.keys(data).forEach(key => {
        if (key === "numberOfEmployees") return;

        errors[key] = !data[key] ? "この項目が必須です。" : false;
      });

      if (!Object.keys(errors).reduce((acc, cur) => acc || Boolean(errors[cur]), false)) {
        await signIn(data.email, data);
      } else {
        const el = document.querySelector('.error');
        if (el) el.scrollIntoView();
      }
    } catch (e) {
      error = e;
    } finally {
      loading = false;
      showEmailNotification = false;
    }
  }

  async function signIn(emailAddress, profile) {
    try {
      loading = true;
      showEmailNotification = !(!shouldResetPassword && password);
      const authInfo = await window.ellx.login({
        email: emailAddress,
        password: !shouldResetPassword && password,
        language: $language,
      });

      if (profile) {
        connect();
        updateProfile(profile);
      }

      dispatch('success', { authInfo });
    } catch (e) {
      error = e;
      throw e;
    } finally {
      loading = false;
    }
  }

  const update = field => e => data[field] = e.target.value;
</script>

{#if showEmailNotification}
  <Scrim>
      <div
        class:ring-red-500={error}
        class="items-center z-40 shadow-lg bg-white p-12 ring text-black">
        {error ? $_("エラーが発生しました。恐れ入りますが、リフレッシュしてもう一度発信してみてください。") : $_("認証メールを発信しました。ご確認をお願いします。")}
      </div>
  </Scrim>
{/if}

<main
  class:opacity-25={loading}
  class:opacity-100={!loading}
  class="transition duration-300"
  class:pointer-events-none={loading}
>
  <section class="relative block py-24 lg:pt-0">
    <div class="container mx-auto px-4">
      <h1 class="text-center text-6xl pt-8 font-bold tracking-widest uppercase">
        Cap Table
      </h1>
      <div class="text-center mt-8 text-lg">
        {$_("資本政策表を失敗せず、簡単に作れる。")}
      </div>
      <div class="w-full lg:w-6/12 mx-auto my-12 px-4">
        {#if !loading}
          <img class="w-full shadow rounded" loading="lazy" src="https://i.ibb.co/3SZ2QkR/ezgif-com-gif-maker.gif" alt="cap-table" border="0">
        {/if}
      </div>
      <div class="flex flex-wrap align-center justify-center">
        <div class="w-full lg:w-6/12 px-4">
          <div
            class="relative flex flex-col min-w-0 break-words w-full mb-6 shadow rounded bg-gray-300 mt-8 text-gray-800 antialiased bg-gradient-to-r from-blue-gray-100 via-gray-200 to-warm-gray-200"
          >
            <div class="w-full text-center text-lg md:text-2xl text-black mt-12 px-4">
              {$_("30秒で無料登録、すぐ使えます！")}
            </div>
            <ProfileForm {data} {errors} onSave={register}>
              <div class="w-full text-black mt-20 mb-4">
                {$_("すでに登録済みの方")}
              </div>
                <Input
                  on:change={e => email = e.target.value}
                  placeholder="email"
                  label="email"
                  id="email-signin"
                  type="email"
                  classes=""
                />
                {#if !shouldResetPassword}
                  <Input
                    on:change={e => password = e.target.value}
                    placeholder={$_("パスワード")}
                    label={$_("パスワード")}
                    id="password-signin"
                    type="password"
                    classes=""
                  />
                {/if}
                <label class="flex items-center my-2">
                <input
                  type="checkbox"
                  bind:checked={shouldResetPassword}
                  class="text-blue-500 transition duration-100 ease-in-out border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:ring-offset-0">
                  <span class="ml-2 text-sm">{$_("パスワードを忘れた方はこちらチェックしてください。")}</span>
                </label>

                <div class="text-center">
                  <button
                    on:click={() => signIn(email)}
                    class="bg-gray-600 tracking-widest transition duration-300 font-bold w-full text-white active:bg-gray-700 text-sm font-bold uppercase px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 mt-6"
                    type="button"
                  >
                    {$_("ログイン")}
                  </button>
                </div>

                {#if error}
                  <div class="text-center mt-8 text-lg text-red-500 bg-red-100 bg-opacity-10 rounded-lg p-2">
                    {error}
                  </div>
                {/if}
            </ProfileForm>
          </div>
        </div>
      </div>
    </div>
  </section>
</main>
