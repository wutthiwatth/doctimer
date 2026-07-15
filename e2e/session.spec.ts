import { expect, test } from '@playwright/test'
test('default CPR session flow', async ({ page }) => {
  page.on('pageerror', (error) => console.error('PAGE_ERROR', error.message))
  await page.goto('/')
  await page.getByRole('link', { name: /เลือก Set นี้/ }).click()
  await page.getByRole('button', { name: /เริ่ม Session/ }).click()
  await expect(page.getByText('CPR Cycle', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /หยุดชั่วคราว/ }).click()
  await expect(page.getByText('หยุดชั่วคราว', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /ดำเนินการต่อ/ }).click()
  await page
    .getByRole('button', { name: /ครบตอนนี้/ })
    .first()
    .click()
  await page.locator('.alert-overlay').getByRole('button', { name: 'รับทราบ' }).click()
})
