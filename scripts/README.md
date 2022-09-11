# Script writing legend

**All event lines must be seperated by 2 new lines to be counted as a new event and be loaded**
Example:
> **`Event1`**
>
> **`Event2`**
>
> **`Event3`**

### Settings:
##### MUSIC
> ###### Play music
> ###### Usage:
> **`MUSIC FileName Volume`**
> - FileName - Title of the file (without the file type)
> - Volume, default is 1 - Floating point between 0 and 1
> ###### Example:
> **`MUSIC InsideAHouse 0.15`**

##### BACKGROUND
> ###### Change the frame background
> ###### Usage:
> **`BACKGROUND FileName`**
> - FileName - Title of the file (without the file type)
> ###### Example:
> **`BACKGROUND Mayor'sResidence`**

### Dialogue:
##### HIDE_DIALOGUE
> ###### Hide the dialogue box
##### SHOW_DIALOGUE
> ###### Show the dialogue box
##### SPEAK
> ###### Speak a given text
> ###### Usage:
> **`SPEAK Text`**
> - Change text color, default is white - **`${color/hex/rgb}`**
> - New line (**max 3 per speak event**, if the text exceeds 4 lines, **it will be disregarded**) - **`&{NEWLINE}`**
> - Change text scroll speed, default is 60. **The lower the speed, the faster the text scrolls** - **`%{integer/"default"}`**
> ###### Example:
> **`SPEAK ${red}This ${white}is very important, read %{240}carefully. %{default}${#39FF14}This is just green text.`**

### Effects:
##### SFX
> ###### Play a sound effect
> ##### Usage:
> **`SFX Filename Volume`**
> - FileName - Title of the file (without the file type)
> - Volume, default is 1 - Floating point between 0 and 1
> ###### Example:
> **`SFX Hey 0.75`**

### Other:
##### WAIT
> ###### Wait before continuing
> ###### Usage:
> **`WAIT Time`**
> - Time - Time to wait for in milliseconds
> ##### Example:
> **`WAIT 2000`**