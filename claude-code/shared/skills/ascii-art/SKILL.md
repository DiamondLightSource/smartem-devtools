---
name: ASCII Art
description: Generate ASCII art diagrams using graph-easy, boxes, and figlet CLI tools
version: 1.0.0
tags: [ascii, diagrams, documentation, architecture]
---

# ASCII Art Skill

Generate ASCII art diagrams for documentation using CLI tools.

## Prerequisites

```bash
# Check if installed
which graph-easy boxes figlet

# Install on Debian/Ubuntu
sudo apt install libgraph-easy-perl boxes figlet
```

## Graph-Easy (Architecture Diagrams)

Converts text descriptions to ASCII flowcharts and diagrams.

### Basic Syntax

```bash
# Simple connection
graph-easy <<< '[A] --> [B]'

# Labelled edge
graph-easy <<< '[A] -- label --> [B]'

# Bidirectional
graph-easy <<< '[A] <--> [B]'

# Multiple connections
graph-easy <<< '[A] --> [B] --> [C]'
```

### Node Styling

```bash
# Named nodes
graph-easy <<< '[Backend] --> [Frontend]'

# Multi-word nodes
graph-easy <<< '[API Server] --> [Web Client]'
```

### Groups (System Boundaries)

```bash
graph-easy << 'EOF'
( Outside [Microscope] [EPU] )
( Inside [Agent] --> [Backend] )
[Microscope] --> [Agent]
[EPU] --> [Agent]
EOF
```

### Common Patterns

#### Data Flow Diagram

```bash
graph-easy << 'EOF'
[Source] --> [Transform] --> [Load]
EOF
```

#### Dependency Graph

```bash
graph-easy << 'EOF'
[common]
[backend] --> [common]
[agent] --> [common]
[agent] --> [backend]
EOF
```

#### Client-Server

```bash
graph-easy << 'EOF'
[Client] -- HTTP --> [Server]
[Server] -- SSE --> [Client]
EOF
```

### Edge Styles

```bash
# Dotted line
graph-easy <<< '[A] ..> [B]'

# Bold line
graph-easy <<< '[A] ==> [B]'

# No arrow
graph-easy <<< '[A] -- [B]'
```

### Output Formats

```bash
# ASCII (default)
graph-easy <<< '[A]-->[B]'

# Box drawing characters (nicer lines)
graph-easy --as=boxart <<< '[A]-->[B]'
```

## Boxes (Decorative Boxes)

Wraps text in ASCII art boxes.

### Basic Usage

```bash
echo "Title" | boxes

echo "Section Header" | boxes -d stone

echo "Comment" | boxes -d shell
```

### Common Styles

```bash
# Simple
echo "Text" | boxes -d simple

# Stone (heavy)
echo "Text" | boxes -d stone

# Shell comment
echo "Text" | boxes -d shell

# C comment
echo "Text" | boxes -d c-cmt
```

### Remove Box

```bash
# Remove box from text
cat boxed-text.txt | boxes -r
```

### List Available Designs

```bash
boxes -l
```

## FIGlet (Text Banners)

Creates large ASCII text banners.

### Basic Usage

```bash
figlet "SmartEM"

figlet -f small "Title"

figlet -f banner "HEADER"
```

### Common Fonts

```bash
# Default
figlet "Text"

# Small
figlet -f small "Text"

# Banner
figlet -f banner "Text"

# Mini
figlet -f mini "Text"
```

### List Available Fonts

```bash
figlet -I2  # Show default font directory
ls /usr/share/figlet/
```

## Templates

### System Boundary Diagram

```bash
graph-easy << 'EOF'
( Outside
  [External Service]
  [Hardware]
)

( Inside
  [Component A] --> [Component B]
  [Component B] --> [Component C]
)

[External Service] --> [Component A]
[Hardware] --> [Component A]
EOF
```

### Bidirectional Data Flow

```bash
graph-easy << 'EOF'
[Agent] -- REST (data) --> [Backend]
[Backend] -- SSE (events) --> [Agent]
EOF
```

### Layered Architecture

```bash
graph-easy << 'EOF'
[UI Layer]
[API Layer]
[Service Layer]
[Data Layer]

[UI Layer] --> [API Layer]
[API Layer] --> [Service Layer]
[Service Layer] --> [Data Layer]
EOF
```

## Tips

1. **Keep it simple** - ASCII diagrams work best with few nodes
2. **Use groups** for system boundaries
3. **Label edges** to show protocols/data types
4. **Preview first** - run command before pasting into docs
5. **boxart output** often looks better than plain ASCII

## References

- [Graph-Easy Manual](http://bloodgate.com/perl/graph/manual/)
- [Boxes](https://boxes.thomasjensen.com/)
- [FIGlet](http://www.figlet.org/)
