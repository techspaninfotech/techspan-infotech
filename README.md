# TechSpan Infotech Website

A premium, responsive corporate website for **TechSpan Infotech**, built as a lightweight static site and ready for GitHub Pages.

## Technology stack

- Semantic HTML5
- Modern CSS3 with custom properties, responsive layouts and reduced-motion support
- Vanilla JavaScript
- [Swiper.js](https://swiperjs.com/) for the testimonial carousel
- [Font Awesome](https://fontawesome.com/) for interface icons
- Google Fonts (Poppins and Inter)

## File structure

```text
.
├── index.html   # Page content and semantic structure
├── style.css    # Complete visual system and responsive styles
├── script.js    # Navigation, animation, particles, slider and form behavior
└── README.md    # Project documentation
```

## Run locally

No build step or server is required. Open `index.html` directly in a browser. For the most accurate local behavior, you can also serve the folder with any simple static web server.

## Deploy with GitHub Pages

1. Open the repository on GitHub and go to **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select the `main` branch and the `/ (root)` folder.
4. Save. GitHub will provide the public Pages URL after the first deployment completes.

All project references are relative, so the site works from a repository Pages URL without path changes.

## Replace launch placeholders

Search `index.html` for `placeholder`, `.example`, or the following values:

- `hello@techspaninfotech.example`
- `+91 00000 00000`
- `Maharashtra, India`
- Demo testimonial names, companies and quotes
- Social links currently set to `#`
- Marketing statistics (`100+`, `98%`, `6+`) and the `Since 2020` highlight

The testimonials intentionally say **Demo testimonial** and their company names say **Placeholder** so they cannot be mistaken for verified client endorsements.

## Connect a real contact form

The contact form currently validates in the browser and displays a demo confirmation. It does not transmit or store data. To receive submissions on a static GitHub Pages site, connect it to a service such as:

- [Web3Forms](https://web3forms.com/)
- [Formspree](https://formspree.io/)
- [EmailJS](https://www.emailjs.com/)
- Your own external HTTPS backend

Follow the chosen provider's documentation, add its form endpoint or JavaScript integration, and replace the demo submit handler in `script.js`. Never commit secret API keys to this public repository.

## Custom domain and HTTPS

In **Settings → Pages**, enter the custom domain and follow GitHub's displayed DNS instructions. A `CNAME` file can also be placed at the repository root containing only the domain name. After DNS is active, enable **Enforce HTTPS** in the Pages settings. DNS and certificate provisioning can take time to complete.

## Notes

- Motion effects automatically simplify for visitors who enable `prefers-reduced-motion`.
- Custom cursor, magnetic interactions and 3D tilt only run on fine-pointer desktop devices.
- CDN assets require an internet connection. If fully offline operation is required, download and self-host the font and library files, then update their references in `index.html`.


## Dedicated pages

Header navigation opens `about.html`, `services.html`, `technologies.html`, `why-choose-us.html`, `testimonials.html`, and `contact.html`. The homepage retains the original overview sections. All pages share `style.css` and `script.js` and work directly on GitHub Pages without a router or build step.

## Admin dashboard
Open https://techspaninfotech.com/admin/ and choose Login with GitHub.
Authentication uses the Cloudflare Worker; the Client Secret stays in Cloudflare.
Only the techspaninfotech account is allowed by the deployed Worker.
Contact, Statistics & Social Links edits content/settings.json.
Website Content edits shared section JSON files, so homepage and dedicated-page sections stay synchronized.
Edit text, then Publish. GitHub Pages deployment must finish before the public changes appear.
Text only is supported: no arbitrary HTML or layout editing. Contact form delivery remains a separate integration.
GitHub public_repo OAuth permission covers public repositories accessible to the authorized account, not just this repository.
Do not use admin on an untrusted device; sign out when finished.
If login hangs, allow popups and use the exact https://techspaninfotech.com/admin/ origin.
Static HTML is the offline fallback. Newly published CMS text is loaded via content.js.

## Guest live chat

A guest chatbox is included on every public page. Required name, mobile number, email and privacy consent are collected before chat begins. Admin inbox: `/admin/chat/`, also linked from the content dashboard. Live operation requires a separate Cloudflare `techspan-chat` Worker, a D1 `CHAT_DB` binding, the supplied schema and a daily retention trigger. See `CHAT-SETUP.md` for activation. Until that backend is deployed, the frontend shows an unavailable notice; it does not pretend to deliver messages. Guest data/messages belong in D1, never in GitHub.
