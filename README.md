# DONT FALL 
CS 174A Winter 2022
Created by Justin He, Trevor Ong, Darren Zhang

## STARTING THE PROJECT
To run the project, run `./host.command` (if on MacOS) or `./host.bat` (if on windows) in the root project directory. Once executed, the project should be accessable on a web browser at "http://localhost:8000/". 

## GAME INSTRUCTIONS
The game scene consists of a pulley (teapot), rock wall, ground, two climbers, and a rope. The player can control parameters of the system using sliders at the top, with the parameters being the climber weight, belayer weight, climber starting fall height, and the pulley/quickdraw height. Camera control buttons are available in the panel below the scene which attach to either the main scene (`Control + 0`), climber perspective (`Control + 1`), or belayer perspective (`Control + 2`). Buttons for moving the location of the sun are also available if desired (`i` for left and `l` for right).
Once the player presses the "Make climbers fall" button (`Shift + D`), the fall is initiated and physics is simulated using an analytically solved method that assumes certain properties of the system (ex. the rope is stretched around the top of the pulley). Note this may not be entirely physically accurate and can look strange if the assumptions of the analytical solution are not met. To reset the scene, the player can modify the climber height parameter, which will return the climber and belayer to their initial state.