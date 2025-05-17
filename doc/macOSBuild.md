# MacOS instructions 
⚠️ The app is not notarized so you must run the following command after installation to allow it to run:

```bash
# Replace with the path to the app. This is the default installation path.
xattr -c /Applications/Move\ Set\ Manager.app 
```

This will tell the gatekeeper that the app is safe to run.
