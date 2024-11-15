# Command-Line Interface

This workspace provides various methods for managing badges. Below is a list of available actions and instructions on how to execute them within this project.

## Upload a badge texture

This action uploads badge textures. Upon running the command, it will prompt the following:
* The directory path where badge textures are stored (_directory containing directories with different badges' textures_)
* AWS Programmatic User Access Keys

Before proceeding, ensure that the badge texture directories follow the service’s naming and structural conventions:

- **Directory Name**: It should match the badge ID, using lowercase letters and snake_case (e.g., `all_day_adventurer`).
- **Directory Structure**:
  - Each directory should contain two subdirectories named `2d` and `3d` for storing textures in each format.
  - The `2d` subdirectory must contain a single file named `normal.png`.
  - The `3d` subdirectory should include three files: `basecolor.png`, `hrm.png`, and `normal.png`.

