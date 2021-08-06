import { Template } from 'meteor/templating';

export function setHelpers() {
  Template.registerHelper("hostIsSandstorm", function() {
    return process.env.SANDSTORM === '1'
  })
}
