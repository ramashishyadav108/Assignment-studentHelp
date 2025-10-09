# Cloudinary PDF Upload Fix

## Problem
PDF uploads were failing with error:
```
public_id (student-help-pdfs/1760044551238-JD SDE-1 FE&BE Campus DoubleTick&QuickSell) is invalid
```

**Root Cause:** Cloudinary's `public_id` doesn't accept special characters like `&`, spaces, and other symbols in filenames.

## Solution

### Updated File Sanitization
Modified `src/lib/cloudinary.ts` to sanitize filenames before upload:

```typescript
const cleanFileName = fileName
  .replace(/\.[^/.]+$/, '')              // Remove extension
  .replace(/[^a-zA-Z0-9_-]/g, '_')      // Replace special chars with underscore
  .replace(/_+/g, '_')                  // Replace multiple underscores with single
  .replace(/^_+|_+$/g, '');             // Remove leading/trailing underscores
```

### Example Transformations
| Original Filename | Sanitized public_id |
|-------------------|---------------------|
| `JD SDE-1 FE&BE Campus DoubleTick&QuickSell.pdf` | `1760044551238-JD_SDE-1_FE_BE_Campus_DoubleTick_QuickSell` |
| `My File (2024) - Copy.pdf` | `1760044551238-My_File_2024_Copy` |
| `Document & Notes #1.pdf` | `1760044551238-Document_Notes_1` |

### What Characters Are Allowed Now
✅ **Allowed:**
- Letters: `a-z`, `A-Z`
- Numbers: `0-9`
- Dash: `-`
- Underscore: `_`

❌ **Replaced with underscore:**
- Spaces: ` `
- Ampersand: `&`
- Parentheses: `()` 
- Hash: `#`
- At sign: `@`
- Plus: `+`
- Equals: `=`
- Any other special characters

## Testing

### 1. Test with Problematic Filename
```bash
# Upload a file named: "JD SDE-1 FE&BE Campus DoubleTick&QuickSell.pdf"
# Should now work without errors
```

### 2. Expected Behavior
```
✅ File sanitized to: 1760044551238-JD_SDE-1_FE_BE_Campus_DoubleTick_QuickSell
✅ Uploaded to Cloudinary successfully
✅ PDF accessible via secure_url
```

### 3. Check Console Logs
Look for:
```
Cloudinary upload successful: {
  public_id: '1760044551238-JD_SDE-1_FE_BE_Campus_DoubleTick_QuickSell',
  secure_url: 'https://res.cloudinary.com/...',
  type: 'authenticated'
}
```

## File Changes

**Modified:** `src/lib/cloudinary.ts`
- Added comprehensive filename sanitization
- Removes all special characters except dash and underscore
- Prevents duplicate underscores
- Cleans up leading/trailing underscores

## Benefits

✅ **Works with any filename** - No more upload errors
✅ **Preserves readability** - Uses underscores instead of removing chars
✅ **Cloudinary-compliant** - Follows public_id naming rules
✅ **Maintains uniqueness** - Timestamp prefix prevents conflicts
✅ **Clean public_ids** - No multiple underscores or trailing chars

## Verification Steps

1. **Upload PDF with special characters in name**
   - Go to: http://localhost:3002/pdfs/upload
   - Upload file with `&`, spaces, `()`, etc.
   - Should succeed without errors

2. **Check Upload Success**
   - Should see success message
   - PDF should appear in "My PDFs" page
   - PDF should be viewable

3. **Check Console**
   - No Cloudinary errors
   - Should see "Cloudinary upload successful" log

4. **Check Database**
   - PDF entry created with sanitized fileName
   - cloudinaryUrl present

## Notes

- Original filename is still stored in database as-is
- Only the Cloudinary `public_id` is sanitized
- Users see original filename in UI
- Download still uses original filename
- Sanitization is one-way (for upload only)

## Common Test Cases

| Test Case | Expected Result |
|-----------|-----------------|
| `File with spaces.pdf` | ✅ Uploads as `timestamp-File_with_spaces` |
| `Document&Notes.pdf` | ✅ Uploads as `timestamp-Document_Notes` |
| `Test (1).pdf` | ✅ Uploads as `timestamp-Test_1` |
| `My_File-2024.pdf` | ✅ Uploads as `timestamp-My_File-2024` |
| `___Test___.pdf` | ✅ Uploads as `timestamp-Test` (cleaned) |
| `日本語.pdf` | ✅ Uploads as `timestamp-` (non-latin removed) |

## If Issues Persist

1. **Check Cloudinary credentials** in `.env`:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

2. **Verify Cloudinary Dashboard**:
   - Check upload limits
   - Verify folder permissions
   - Check authenticated delivery is enabled

3. **Clear Next.js cache**:
   ```bash
   rm -rf .next
   npm run dev
   ```

## Success Indicators

✅ PDF uploads without errors
✅ File appears in My PDFs list
✅ PDF is viewable in viewer
✅ Download works with original filename
✅ No Cloudinary 400 errors in console
