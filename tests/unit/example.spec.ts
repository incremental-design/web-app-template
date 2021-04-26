import { shallowMount } from '@vue/test-utils';
import HelloWorld from '@/components/HelloWorld.vue';

import { chromium } from 'playwright';

let browser: any;

beforeAll(async () => {
  browser = await chromium.launch({ headless: false });
});

let page: any;

beforeEach(async () => {
  page = await browser.newPage();
});

describe('HelloWorld.vue', async () => {
  it('renders props.msg when passed', () => {
    const msg = 'new message';
    const wrapper = shallowMount(HelloWorld, {
      props: { msg },
    });
    expect(wrapper.text()).toMatch(msg);
  });

  it('should go to a webpage', async () => {
    await page.goto('https://www.example.com');
    expect(await page.title()).toBe('Example Domain');
  });
});

afterEach(async () => {
  await page.close();
});

afterAll(async () => {
  await browser.close();
});
