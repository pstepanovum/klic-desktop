use tauri::menu::{AboutMetadataBuilder, MenuBuilder, SubmenuBuilder};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            let handle = app.handle();

            // Native "About Klic" panel — carries the app + developer info.
            let about = AboutMetadataBuilder::new()
                .name(Some("Klic"))
                .version(Some(env!("CARGO_PKG_VERSION")))
                .authors(Some(vec!["Pavel Stepanov".to_string()]))
                .comments(Some(
                    "Klic desktop — a messenger client. Designed and developed by Pavel Stepanov.",
                ))
                .copyright(Some("Copyright © 2026 Pavel Stepanov"))
                .website(Some("https://klic.pstepanov.dev"))
                .website_label(Some("klic.pstepanov.dev"))
                .build();

            // macOS application menu (the bold "Klic" menu, holds About + Quit).
            let app_menu = SubmenuBuilder::new(handle, "Klic")
                .about(Some(about))
                .separator()
                .services()
                .separator()
                .hide()
                .hide_others()
                .show_all()
                .separator()
                .quit()
                .build()?;

            let file_menu = SubmenuBuilder::new(handle, "File").close_window().build()?;

            // Edit menu — enables Cmd+C/V/X/Z and Select All in text fields.
            let edit_menu = SubmenuBuilder::new(handle, "Edit")
                .undo()
                .redo()
                .separator()
                .cut()
                .copy()
                .paste()
                .select_all()
                .build()?;

            let view_menu = SubmenuBuilder::new(handle, "View").fullscreen().build()?;

            let window_menu = SubmenuBuilder::new(handle, "Window")
                .minimize()
                .maximize()
                .separator()
                .close_window()
                .build()?;

            let menu = MenuBuilder::new(handle)
                .items(&[&app_menu, &file_menu, &edit_menu, &view_menu, &window_menu])
                .build()?;
            app.set_menu(menu)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running klic-desktop");
}
