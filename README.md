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

