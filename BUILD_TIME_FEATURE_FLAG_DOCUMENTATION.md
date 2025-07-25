# Build-Time Feature Flag for Permissions Page

## Overview

A temporary build-time feature flag has been implemented to toggle between two different permissions page implementations:

- `PermissionsPage`  - The original permissions page
- `PermissionsPageV2` - The new permissions page implementation

## Implementation Details

### Files Modified

1. **`builds.yml`**
   - The environment variable `PERMISSIONS_PAGE_V2` value is set to `'true'` for flask builds.

2. **`ui/pages/routes/routes.component.js`**
   - Modified the permissions route to use the build-time environment variable:
   ```javascript
   <Authenticated
     path={PERMISSIONS}
     component={
       process.env.PERMISSIONS_PAGE_V2 === true ||
       process.env.PERMISSIONS_PAGE_V2 === 'true'
         ? PermissionsPageV2
         : PermissionsPage
     }
     exact
   />
   ```

3. **`ui/pages/routes/routes.component.test.js`**
   - Added tests to verify the build-time feature flag functionality

### How to Use the Build-Time Feature Flag

The feature flag is controlled by the `PERMISSIONS_PAGE_V2` environment variable during the build process.

#### To Enable `PermissionsPageV2`:

Set the environment variable to `true` in your `.metamaskrc` file:

```ini
; .metamaskrc
PERMISSIONS_PAGE_V2=true
```

#### To Use `PermissionsPage`:

Either set the environment variable to `false` or leave it undefined:

```ini
; .metamaskrc
PERMISSIONS_PAGE_V2=false
```
