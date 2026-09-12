import { readFile } from 'node:fs/promises'
import { expect, test, type Page, type TestInfo } from '@playwright/test'
import { DEFAULT_RESUME } from '../src/defaultResume'
import { DEFAULT_CONSTRAINTS } from '../src/constraints'

const fixture = {
  resume: { name: 'Original', contact: ['First', 'Second'], sections: [] },
  constraints: { ...DEFAULT_CONSTRAINTS, maxPages: 2 },
}
const stored = (page: Page) => page.evaluate(() => ({
  resume: JSON.parse(localStorage.getItem('presume:resume')!),
  constraints: JSON.parse(localStorage.getItem('presume:constraints')!),
}))
async function seed(page: Page) {
  await page.goto('./editor/')
  await page.evaluate(data => {
    localStorage.setItem('presume:resume', JSON.stringify(data.resume))
    localStorage.setItem('presume:constraints', JSON.stringify(data.constraints))
  }, fixture)
  await page.reload()
}
async function backup(page: Page, info: TestInfo) {
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download backup', exact: true }).click()
  const path = info.outputPath('document-backup.json')
  await (await pending).saveAs(path)
  await info.attach('backup', { path, contentType: 'application/json' })
  return JSON.parse(await readFile(path, 'utf8')).data
}

test('sample discovery writes nothing; structural undo/redo and history survive routes', async ({ page }) => {
  await page.goto('./')
  expect(await stored(page)).toEqual({ resume: null, constraints: null })
  await page.getByRole('button', { name: 'Open the editor', exact: true }).click()
  await expect(page.getByText('Sample — not saved', { exact: true })).toBeVisible()
  expect(await stored(page)).toEqual({ resume: null, constraints: null })
  await seed(page)
  const pageRoot = await page.locator('.resume-page').elementHandle()
  // Keyboard activation selects the intended control; overlapping pointer targets belong to T3.
  await page.getByRole('button', { name: 'Remove contact item: First', exact: true }).press('Enter')
  await expect(page.locator('.resume-contact [contenteditable]').first()).toBeFocused()
  expect((await stored(page)).resume.contact).toEqual(['Second'])
  await page.getByRole('button', { name: /^Undo/ }).click()
  await expect(page.locator('.resume-contact [contenteditable]').first()).toHaveText('First')
  await expect(page.locator('.resume-contact [contenteditable]').first()).toBeFocused()
  expect(await pageRoot!.evaluate(element => element === document.querySelector('.resume-page'))).toBe(true)
  await page.getByRole('button', { name: /^Redo/ }).click()
  await page.getByRole('link', { name: 'Presume home' }).click()
  await page.getByRole('button', { name: 'Continue editing' }).first().click()
  await page.getByRole('button', { name: /^Undo/ }).click()
  await page.locator('.resume-contact [contenteditable]').first().fill('Restored and edited')
  expect((await stored(page)).resume.contact).toEqual(['Restored and edited', 'Second'])
  await expect(page.getByRole('button', { name: /^Redo/ })).toBeDisabled()
})

test('ordinary typing groups and document shortcuts restore text and selection', async ({ page }) => {
  await seed(page)
  const name = page.locator('.resume-name')
  await name.fill('')
  await name.pressSequentially('Alice', { delay: 25 })
  await name.press('ControlOrMeta+z')
  await expect(name).toHaveText('')
  await expect(name).toBeFocused()
  await name.press('ControlOrMeta+z')
  await expect(name).toHaveText('Original')
  await name.press('ControlOrMeta+Shift+z')
  await name.press('ControlOrMeta+Shift+z')
  await expect(name).toHaveText('Alice')
  await name.press('ArrowRight')
  await name.pressSequentially(' Smith')
  await page.getByRole('button', { name: /^Undo/ }).click()
  await expect(name).toHaveText('Alice')
  expect(await name.evaluate(element => {
    const selection = getSelection()!
    return { inside: element.contains(selection.anchorNode), offset: selection.anchorOffset }
  })).toEqual({ inside: true, offset: 5 })
})

test('focused restore and reset replace both halves; history restores their exact values', async ({ page }, info) => {
  await seed(page)
  page.on('dialog', dialog => dialog.accept())
  const name = page.locator('.resume-name')
  await name.fill('Focused draft')
  await expect(name).toBeFocused()
  const replacement = { resume: { name: 'Imported', contact: ['New'], sections: [] }, constraints: DEFAULT_CONSTRAINTS }
  await page.locator('input[type=file]').setInputFiles({
    name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ format: 'presume-backup', version: 1, exportedAt: '2026-09-12T00:00:00Z', data: replacement })),
  })
  await expect(name).toHaveText('Imported')
  await expect(name).toBeFocused()
  expect(await backup(page, info)).toEqual(replacement)
  await page.getByRole('button', { name: /^Undo/ }).click()
  await expect(name).toHaveText('Focused draft')
  await expect(name).toBeFocused()
  await page.getByRole('button', { name: 'Reset template' }).evaluate((button: HTMLButtonElement) => button.click())
  await expect(name).toHaveText(DEFAULT_RESUME.name)
  await expect(name).toBeFocused()
  expect(await stored(page)).toEqual({ resume: DEFAULT_RESUME, constraints: DEFAULT_CONSTRAINTS })
  await page.getByRole('button', { name: /^Undo/ }).click()
  expect(await stored(page)).toEqual({ ...fixture, resume: { ...fixture.resume, name: 'Focused draft' } })
})

test('a failed second write retains the entire draft, history, backup and retry across routes', async ({ page }, info) => {
  await seed(page)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.evaluate(() => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === 'presume:constraints') throw new DOMException('test quota', 'QuotaExceededError')
      original.call(this, key, value)
    }
    Object.assign(window, { restoreStorage: () => { Storage.prototype.setItem = original } })
  })
  await page.locator('.resume-name').fill('Unsaved full draft')
  await expect(page.getByText('Changes are not saved in this browser.', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Presume home' }).click()
  await page.getByRole('button', { name: 'Continue editing' }).first().click()
  await expect(page.locator('.resume-name')).toHaveText('Unsaved full draft')
  expect(await backup(page, info)).toEqual({ ...fixture, resume: { ...fixture.resume, name: 'Unsaved full draft' } })
  await page.evaluate(() => (window as unknown as { restoreStorage: () => void }).restoreStorage())
  await page.getByRole('button', { name: 'Retry saving', exact: true }).click()
  await expect(page.getByText('Saved in this browser', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /^Undo/ }).click()
  expect(await stored(page)).toEqual(fixture)
  expect(errors).toEqual([])
})

test('denied storage getter permits startup, navigation, editing and a complete backup', async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('denied', 'SecurityError') } }))
  await page.goto('./')
  await page.getByRole('button', { name: 'Open the editor', exact: true }).click()
  await page.locator('.resume-name').fill('Available without storage')
  await expect(page.getByText('Changes are not saved in this browser.', { exact: true })).toBeVisible()
  expect((await backup(page, info)).resume.name).toBe('Available without storage')
  expect(errors).toEqual([])
})

test('invalid stored data is preserved until an explicit replacement and remains downloadable', async ({ page }) => {
  await page.goto('./editor/')
  await page.evaluate(() => localStorage.setItem('presume:resume', '{broken document'))
  await page.reload()
  await page.locator('.resume-name').fill('Recovery draft')
  await expect(page.getByRole('button', { name: 'Download unreadable data' })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('presume:resume'))).toBe('{broken document')
  page.once('dialog', dialog => dialog.dismiss())
  await page.getByRole('button', { name: 'Replace browser data' }).click()
  expect(await page.evaluate(() => localStorage.getItem('presume:resume'))).toBe('{broken document')
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: 'Replace browser data' }).click()
  await expect(page.getByText('Saved in this browser', { exact: true })).toBeVisible()
  expect((await stored(page)).resume.name).toBe('Recovery draft')
})

test('Select All replacement is a separate history group from the preceding typing', async ({ page }) => {
  await seed(page)
  const name = page.locator('.resume-name')
  await name.click()
  await name.pressSequentially('X')
  const beforeReplacement = await name.textContent()
  await name.press('ControlOrMeta+a')
  await name.pressSequentially('Bob')
  await expect(name).toHaveText('Bob')
  await name.press('ControlOrMeta+z')
  await expect(name).toHaveText(beforeReplacement!)
  await name.press('ControlOrMeta+z')
  await expect(name).toHaveText('Original')
})

test('Back during a composing draft keeps the editor mounted until completion', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Open the editor', exact: true }).click()
  const name = page.locator('.resume-name')
  await name.focus()
  // A lifecycle regression, not evidence of real platform IME fidelity (T2-3).
  await name.evaluate(element => {
    element.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
    element.textContent = '完成'
    element.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }))
  })
  await page.goBack()
  await expect(name).toBeVisible()
  await name.evaluate(element => element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '完成' })))
  await expect(page.getByRole('button', { name: 'Continue editing' }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Continue editing' }).first().click()
  await expect(name).toHaveText('完成')
  await name.fill('Still editable')
  await expect(page.getByText('Saved in this browser', { exact: true })).toBeVisible()
  expect((await stored(page)).resume.name).toBe('Still editable')
})

test('holding Enter on a formatting stepper is one undoable gesture', async ({ page }) => {
  await page.goto('./editor/')
  await page.getByRole('button', { name: /Fit constraints/ }).click()
  await page.getByRole('button', { name: 'Increase max pages', exact: true }).focus()
  await page.keyboard.down('Enter')
  await page.keyboard.down('Enter')
  await page.keyboard.down('Enter')
  await page.keyboard.up('Enter')
  expect((await stored(page)).constraints.maxPages).toBe(4)
  await page.getByRole('button', { name: /^Undo/ }).click()
  expect((await stored(page)).constraints.maxPages).toBe(1)
})
