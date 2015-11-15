
var ScriptServer = require('scriptserver');

module.exports = function(server) {

    server.use([
        'scriptserver-command',
        'scriptserver-json',
        'scriptserver-helpers'
    ]);

    server.command('portal', cmd => {
        var currentPos, portalPos, portals = [];
        var sub = cmd.args[0];
        var name = cmd.args[1];

        if (sub === 'ls') return server.getJSON('portal')
            .then(d => server.tellRaw(Object.keys(d).join(', '), cmd.sender, {color: 'gray'}))
            .catch(e => server.tellRaw(e.message, cmd.sender, {color: 'red'}));

        if (sub === 'save') return server.getJSON('portal', name)
            .then(d => {
              if (d && d.portals.length) portals = d.portals;
            })
            .then(d => server.getCoords(cmd.sender))
            .then(d => {
              currentPos = d;
              currentPos.portals = portals;
            })
            .then(d => server.setJSON('portal', name, currentPos))
            .then(d => server.tellRaw(`Location saved as ${name}, use ~portal link ${name} to create a portal to this location`, cmd.sender, {color: 'gray'}))
            .then(d => {
              if (portals) {
                portals.forEach(portal => {
                  server.testForBlock(portal, 'end_gateway')
                    .then(res => {
                      if (res) return server.send(`/fill ${portal.x} ${portal.y} ${portal.z} ${portal.x} ${+portal.y + 1} ${portal.z} minecraft:end_gateway 0 replace {ExactTeleport:1,ExitPortal:{X:${currentPos.x},Y:${currentPos.y},Z:${currentPos.z}}}`);
                    });
                });
              }
            })
            .catch(e => server.tellRaw(e.message, cmd.sender, {color: 'red'}));

        if (sub === 'link') return server.getCoords(cmd.sender)
            .then(d => currentPos = d)
            .then(d => server.getJSON('portal', name))
            .then(d => {
              if (!d) throw new Error(`Portal ${name} doesn't exist yet.`);
              portalPos = d;
              portalPos.portals.push(currentPos);
            })
            .then(d => server.setJSON('portal', name, portalPos))
            .then(d => server.tellRaw(`Linking portal to ${name}... stand back!`, cmd.sender, {color: 'gray'}))
            .then(d => server.wait(2000))
            .then(d => server.send(`/fill ${currentPos.x} ${currentPos.y} ${currentPos.z} ${currentPos.x} ${+currentPos.y + 1} ${currentPos.z} minecraft:end_gateway 0 replace {ExactTeleport:1,ExitPortal:{X:${portalPos.x},Y:${portalPos.y},Z:${portalPos.z}}}`))
            .catch(e => server.tellRaw(e.message, cmd.sender, {color: 'red'}));

        return server.tellRaw('Invalid arguments', cmd.sender, {color: 'red'});
    });

};
